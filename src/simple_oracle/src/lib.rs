use ic_cdk::{update, query, init};
use candid::{candid_method, Principal};
use std::cell::RefCell;
use std::collections::HashMap;
use std::str::FromStr;
use types::*;

mod types;

const VETKD_SYSTEM_API_CANISTER_ID: &str = "s55qq-oqaaa-aaaaa-aaakq-cai";

pub type Key = Vec<u8>;
pub type CipherValue = String;

thread_local! {
    static STORE: RefCell<HashMap<Key, CipherValue>> = RefCell::new(HashMap::default());
    static OWNER: RefCell<Principal> = RefCell::new(Principal::anonymous());
}

#[update]
#[candid_method(update)]
pub fn set_val(key: Key, val: CipherValue) {
    // If you restrict the caller to the owner, you can write the assertion like this:
    // assert_eq!(ic_cdk::caller(), owner());
    STORE.with(|s| {
        s.borrow_mut().insert(key, val);
    });
}

#[query]
#[candid_method(query)]
pub fn get_val(key: Key) -> Option<CipherValue> {
    STORE.with(|s| {
        let store = s.borrow();
        store.get(&key).cloned()
    })
}

#[update]
#[candid_method(update)]
pub fn get_val_unwrap(key: Key) -> CipherValue {
    get_val(key).unwrap_or_default()
}

#[init]
fn init() {
    let caller = ic_cdk::caller();
    ic_cdk::println!("owner: {}", caller);
    OWNER.with(|o| {
        *o.borrow_mut() = caller;
    });
}

pub fn owner() -> Principal {
    OWNER.with(|o| {
        o.borrow().clone()
    })
}

#[update]
async fn symmetric_key_verification_key() -> String {
    let request = VetKDPublicKeyRequest {
        canister_id: None,
        derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_test_key_1(),
    };

    let (response,): (VetKDPublicKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_public_key",
        (request,),
    )
    .await
    .expect("call to vetkd_public_key failed");

    hex::encode(response.public_key)
}

#[update]
async fn encrypted_symmetric_key_for_caller(encryption_public_key: Vec<u8>) -> String {
    debug_println_caller("encrypted_symmetric_key_for_caller");

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        public_key_derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_test_key_1(),
        encryption_public_key,
    };
    let (response,): (VetKDEncryptedKeyReply,) = ic_cdk::api::call::call(
        vetkd_system_api_canister_id(),
        "vetkd_encrypted_key",
        (request,),
    )
    .await
    .expect("call to vetkd_encrypted_key failed");

    hex::encode(response.encrypted_key)
}

fn vetkd_system_api_canister_id() -> CanisterId {
    CanisterId::from_str(VETKD_SYSTEM_API_CANISTER_ID).expect("failed to create canister ID")
}

fn bls12_381_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381,
        name: "test_key_1".to_string(),
    }
}

fn debug_println_caller(method_name: &str) {
    ic_cdk::println!(
        "{}: caller: {} (isAnonymous: {})",
        method_name,
        ic_cdk::caller().to_text(),
        ic_cdk::caller() == candid::Principal::anonymous()
    );
}