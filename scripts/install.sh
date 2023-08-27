set -e
trap 'catch' ERR
catch() {
  dfx identity use default
  echo "FAIL"
  exit 1
}

dfx stop && dfx start --background --clean

# deploy all canisters
dfx canister create system_api --specified-id s55qq-oqaaa-aaaaa-aaakq-cai
dfx deploy system_api
dfx deploy vetkd_backend
dfx deploy simple_oracle
dfx deploy front