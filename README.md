# INSTRUCTION: type in console on ubuntu

  
1. account setup
```
> git clone https://github.com/EOSIO/eosio.contracts --branch v1.7.0 --single-branch
> cd eosio.contracts
> cd contract
> cd eosio.token
> eosio-cpp -I include -abigen -o eosio.token.wasm ./src/eosio.token.cpp
```

2. create accout eosio.token
```
> cleos creat accout eosio eosio.token >KEY<
> cleos set contract eosio.token >path-to-token-folder< ./eosio.token.wasm --abi eosio.token.abi -p token@active
> cleos get account  eosio.token
```

3. unlock wallet
```
> cleos wallet unlock
```
4. token creation
```
> cleos push action eosio.token issue '["adrian", "1000 DOGCOIN","here you go"]' -p eosio.token@active
> cleos get table eosio.token bob account
```
5. compile 
```
> eosio-cpp -abigen -o dogcontract2.wasm ./dogcontract2.cpp 
```
6. deploy
```
cleos set contract inline(because we have inline account) >source path< ./dogcontract2.wasm --abi dogcontract2.abi-p inline@active
```
### you can check if u want
```
cleos get table inline bob balances
cleos transfer bob inline "200 DOGCOIN" "memo" -p bob@active
cleos get table inline payable balances
```
 
#### Contribution:
Dapp Template for Ivan on Tech Academy
