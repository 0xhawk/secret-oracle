# Secret Oracle

This is a demo implementation of Simple Oracle using vetKD to keep the data secret and share it in a certain group of users. Note that the vetKD's sample API is not secure and should not be used in the production environment.

## Motivation

Secret oracles have been one of the areas of promise in the blockchain field so far: by designing the data so that only those with symmetrix keys can access it, it may be possible to limit the scope of public access to valuable data. This could potentially contribute to monetization, which has been difficult for Oracle operators, and will hopefully lead to more data being made available on-chain.

In this Demo, we are using ic-vetkd-utils-0.1.0.tgz to generate keys. This is supposed to be used as JS, and in order to use this library as is, we had to implement registering and loading data from WebFront. However, in the future, when this library is able to operate as a Backend Canister, it should be possible to dynamically allow/deny access to data directly from the Canister.

<img width="762" alt="Screenshot 2023-08-28 at 18 52 50" src="https://github.com/0xhawk/secret-oracle/assets/108332185/a14532b8-16cc-4a4b-8141-e3c8859cb643">

## Demo Project Structure
The project structure is mainly as follows:

```
/scripts
  |--install.sh
/src
  |--/front 
  |--/simple_oracle
  |--/system_api
  |--/vetkd_backend
ic-vetkd-utils-0.1.0.tgz
Makefile
```

- `system_api`: This is an unsafe implementation copied from this [repo](https://github.com/dfinity/examples/tree/master/rust/vetkd) to access to the system api related with the vetKD core functionalities.
- `vetkd_backend`: This has the basic function to get an encrypted key and a public key copied from this [repo](https://github.com/dfinity/examples/tree/master/rust/vetkd/src/app_backend). In this demo, the IBE related functions are deleted and focused on the minimam implementations.
- `simple_oracle`: This is a simple oracle and has only simple setter and getter functions for data, which is stored as the cipher text format. We cannot see the raw data from this canister directly because all data are encrypted.
- `front`: This is based on JavaScript working in the browser in this demo to use the `ic-vetkd-utils-0.1.0.tgz` as it is. However, you can replace this with a backend canister after we are able to use the library in the backend. The data provider no longer needs to be on the JavaScript working on the browser in that case.

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
make install
```

All you have to do to launch the demo is contained in the script file. If you want to check the command, please see the `scripts/install.sh`.

This command should finish successfully with output similar to the following one:


```
Deployed canisters.
URLs:
  Frontend canister via browser
    front: http://127.0.0.1:4943/?canisterId=br5f7-7uaaa-aaaaa-qaaca-cai
  Backend canister via Candid interface:
    simple_oracle: http://127.0.0.1:4943/?canisterId=bnz7o-iuaaa-aaaaa-qaaaa-cai&id=be2us-64aaa-aaaaa-qaabq-cai
    system_api: http://127.0.0.1:4943/?canisterId=bnz7o-iuaaa-aaaaa-qaaaa-cai&id=s55qq-oqaaa-aaaaa-aaakq-cai
    vetkd_backend: http://127.0.0.1:4943/?canisterId=bnz7o-iuaaa-aaaaa-qaaaa-cai&id=bd3sg-teaaa-aaaaa-qaaba-cai
```