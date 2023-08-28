import { createActor, vetkd_backend } from "../../declarations/vetkd_backend";
import { simple_oracle } from "../../declarations/simple_oracle";
import * as vetkd from "ic-vetkd-utils";
import { AuthClient } from "@dfinity/auth-client"
import { HttpAgent, Actor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

let fetched_symmetric_key = null;
let vetkd_backend_actor = vetkd_backend;
let simple_oracle_actor = simple_oracle;
let vetkd_backend_principal = await Actor.agentOf(vetkd_backend_actor).getPrincipal();
document.getElementById("principal").innerHTML = annotated_principal(vetkd_backend_principal);

document.getElementById("get_symmetric_key_form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  button.setAttribute("disabled", true);
  const result = document.getElementById("get_symmetric_key_result");

  result.innerText = "Fetching symmetric key...";
  const aes_256_key = await get_aes_256_gcm_key();
  result.innerText = "Done. AES-GCM-256 key available for local usage.";

  button.removeAttribute("disabled");

  fetched_symmetric_key = aes_256_key;
  update_plaintext_button_state();
  update_ciphertext_button_state();

  return false;
});

document.getElementById("encrypt_form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  button.setAttribute("disabled", true);
  const result = document.getElementById("encrypt_result");

  result.innerText = "Encrypting...";
  const ciphertext = await aes_gcm_encrypt(document.getElementById("plaintext").value, fetched_symmetric_key);

  result.innerText = ciphertext;

  button.removeAttribute("disabled");

  const set_value_button = document.getElementById("submit_set_value");
  set_value_button.removeAttribute("disabled");

  return false;
});

document.getElementById("decrypt_form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  button.setAttribute("disabled", true);
  const result = document.getElementById("decrypt_result");

  result.innerText = "Decrypting...";
  try {
    const plaintext = await aes_gcm_decrypt(document.getElementById("ciphertext").value, fetched_symmetric_key);
    result.innerText = "plaintext: " + plaintext;
  } catch (e) {
    result.innerText = "Error: " + e;
  }

  button.removeAttribute("disabled");
  return false;
});

document.getElementById("set_value_form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  button.setAttribute("disabled", true);
  const result = document.getElementById("set_value_result");

  result.innerText = "Setting value...";
  const key = window.crypto.getRandomValues(new Uint8Array(32));
  const value = document.getElementById("encrypt_result").innerText;
  try {
    await set_value(key, value);
    result.innerText = "Key: " + hex_encode(key) + " Value: " + value;
  } catch (e) {
    result.innerText = "Error: " + e;
  }
});

document.getElementById("plaintext").addEventListener("keyup", async (e) => {
  update_plaintext_button_state();
});

document.getElementById("ciphertext").addEventListener("keyup", async (e) => {
  update_ciphertext_button_state();
});

function update_plaintext_button_state() {
  const submit_plaintext_button = document.getElementById("submit_plaintext");
  if (document.getElementById("plaintext").value === "" || fetched_symmetric_key === null) {
    submit_plaintext_button.setAttribute("disabled", true);
  } else {
    submit_plaintext_button.removeAttribute("disabled");
  }
}

function update_ciphertext_button_state() {
  const submit_ciphertext_button = document.getElementById("submit_ciphertext");
  if (document.getElementById("ciphertext").value === "" || fetched_symmetric_key === null) {
    submit_ciphertext_button.setAttribute("disabled", true);
  } else {
    submit_ciphertext_button.removeAttribute("disabled");
  }
}

async function set_value(key, value) {
  await simple_oracle_actor.set_val(key, value);
}

async function get_aes_256_gcm_key() {
  const seed = window.crypto.getRandomValues(new Uint8Array(32));
  const tsk = new vetkd.TransportSecretKey(seed);
  const ek_bytes_hex = await vetkd_backend_actor.encrypted_symmetric_key_for_caller(tsk.public_key());
  const pk_bytes_hex = await vetkd_backend_actor.symmetric_key_verification_key();
  return tsk.decrypt_and_hash(
    hex_decode(ek_bytes_hex),
    hex_decode(pk_bytes_hex),
    vetkd_backend_principal.toUint8Array(),
    32,
    new TextEncoder().encode("aes-256-gcm")
  );
}

async function aes_gcm_encrypt(message, rawKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bits; unique per message
  const aes_key = await window.crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt"]);
  const message_encoded = new TextEncoder().encode(message);
  const ciphertext_buffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aes_key,
    message_encoded
  );
  const ciphertext = new Uint8Array(ciphertext_buffer);
  var iv_and_ciphertext = new Uint8Array(iv.length + ciphertext.length);
  iv_and_ciphertext.set(iv, 0);
  iv_and_ciphertext.set(ciphertext, iv.length);
  return hex_encode(iv_and_ciphertext);
}

async function aes_gcm_decrypt(ciphertext_hex, rawKey) {
  const iv_and_ciphertext = hex_decode(ciphertext_hex);
  const iv = iv_and_ciphertext.subarray(0, 12); // 96-bits; unique per message
  const ciphertext = iv_and_ciphertext.subarray(12);
  const aes_key = await window.crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
  let decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    aes_key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

document.getElementById("login").onclick = async (e) => {
  e.preventDefault();
  let authClient = await AuthClient.create();
  await new Promise((resolve) => {
    authClient.login({
      identityProvider: `http://127.0.0.1:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`,
      onSuccess: resolve,
    });
  });
  // At this point we're authenticated, and we can get the identity from the auth client:
  const identity = authClient.getIdentity();
  // Using the identity obtained from the auth client, we can create an agent to interact with the IC.
  const agent = new HttpAgent({ identity });
  // Using the interface description of our webapp, we create an actor that we use to call the service methods. We override the global actor, such that the other button handler will automatically use the new actor with the Internet Identity provided delegation.
  vetkd_backend_actor = createActor(process.env.vetkd_backend_CANISTER_ID, {
    agent,
  });
  vetkd_backend_principal = identity.getPrincipal();

  document.getElementById("principal").innerHTML = annotated_principal(vetkd_backend_principal);

  fetched_symmetric_key = null;
  document.getElementById("get_symmetric_key_result").innerText = "";
  update_plaintext_button_state();
  update_ciphertext_button_state();

  return false;
};

function annotated_principal(principal) {
  let principal_string = principal.toString();
  if (principal_string == "2vxsx-fae") {
    return "Anonymous principal (2vxsx-fae)";
  } else {
    return "Principal: " + principal_string;
  }
}

const hex_decode = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
const hex_encode = (bytes) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');