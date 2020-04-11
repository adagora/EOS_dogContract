#include <eosio/eosio.hpp>
#include <eosio/contract.hpp>
#include <eosio/asset.hpp>

using namespace eosio;

CONTRACT dogcontract : public contract {

  using contract::contract;
  public:
    dogcontract(name receiver, name code,  datastream<const char*> ds): contract(receiver, code, ds),
    currency_symbol("DOGCOIN", 0) {}

    ACTION insert(name owner, std::string dog_name, int age) {
      require_auth( owner );
      check_balance(owner);
      reduce_balance(owner);
      // Check Balance of sender/owner
      //reduce balance
      dog_index dogs(get_first_receiver(), get_first_receiver().value);
      dogs.emplace(owner, [&]( auto& row ) {
       row.id = dogs.available_primary_key ();
       row.dog_name = dog_name;
       row.age = age;
       row.owner = owner;
     // send_summary(owner, "inserted dog");
    }

    //Charging for insert in DOGECOIN


    ACTION erase(int dog_id) {

      dog_index dogs( get_self(), get_self().value);

      auto dog = dogs.get(dog_id, "Unable to find dog");
      require_auth(dog.owner);

      auto iterator = dogs.find(dog_id);
      dogs.erase(iterator);
    }
    // send_summary(dog.owner, "erased dog");

    ACTION removeall(name user) {

      dog_index dogs( get_first_receiver(), get_first_receiver().value);

      auto owner_index = dogs.get_index<"byowner"_n>();
      auto iterator = owner_index.find(user.value);

      while(iterator != owner_index.end()){
        owner_index.erase(iterator);
        iterator = owner_index.find(user.value);
      }
    }
// send_summary(user, "erased all his/her dogs");

//listener
    [[eosio::on_notify("eosio.token::transfer")]]
    void pay(name from, name to, asset quantity, std::string memo){
      if(from == get_self() || to != get_self()){        //transfer we've sent or not equal;we dont wanna listen it
        return;
      }      
      
      check(quantity.amount > 0, "Not enough coins bro");
      check(quantity.symbol == currency_symbol, "Not the right coin bro");

      balance_index balances(get_self(), from.value);
      auto iterator = balances.find(currency_symbol.raw());

      if(iterator != balances.end()){
        balances.modify(iterator, get_self(), [&](auto row){
          row.funds += quantity;
        });
      }
      else{
        balances.emplace(get_self(), [&](auto &row){
          row.funds = quantity;
        });
      }
  
    }
    

    /* ACTION notify(name user, std::string msg){
      require_auth(get_self());
      require_recipient(user);
    } */

private:
  const symbol currency_symbol;

  TABLE dog {
    int id;
    std::string dog_name;
    int age;
    name owner;

    uint64_t primary_key() const { return id; }
    uint64_t get_secondary_1() const { return owner.value;}

  };

  TABLE balance {
    asset funds;

    uint64_t primary_key() const {return funds.symbol.raw();}
  };



  /* void send_summary(name user, std::string message){
    action(
      permission_level{get_self(),"active"_n},   //we used contract name as permission level
      get_self(), //where do you want push action
      "notify"_n, //name of action
      std:make_tuple(user message) //data we want to send them
      ).send();
  } */

  typedef multi_index<"dogs"_n, dog, indexed_by<"byowner"_n, const_mem_fun<dog, uint64_t, &dog::get_secondary_1>>> dog_index;
  typedef multi_index<"balances"_n, balance> balance_index;

  void check_balance(name user){
    balance_index balances(get_self(), user.value);
    auto row =balances.get(currency_symbol.raw(), "No Balance");
    check(row.funds.amount>= 10, "Not  enough DOGCOIN Deposited");
  }
  void reduce_balance(name user){
    balance_index balances(get_self(),user.value);
    auto interator = balances.find(currency_symbol.raw());
    if(iterator != balances.end()){
      balances.modify(iterator, get_self(), [&] (auto &row){
        row.funds.set_amount(row.funds.amount-10);
      });
    }
  }


};

/*

#### HOW TO COMPILE ####

#account setup 
> git clone https://github.com/EOSIO/eosio.contracts --branch v1.7.0 --single-branch
> cd eosio.contracts
> cd contract
> cd eosio.token
> eosio-cpp -I include -abigen -o eosio.token.wasm ./src/eosio.token.cpp

#create accout eosio.token
> cleos creat accout eosio eosio.token >KEY<
> cleos set contract eosio.token >path-to-token-folder< ./eosio.token.wasm --abi eosio.token.abi -p token@active
> cleos get account  eosio.token

#unlock wallet
> cleos wallet unlock

#token creation
> cleos push action eosio.token issue '["adrian", "1000 DOGCOIN","here you go"]' -p eosio.token@active
> cleos get table eosio.token bob account

#compile 
> eosio-cpp -abigen -o dogcontract2.wasm ./dogcontract2.cpp 

#deploy
cleos set contract inline(because we have inline account) >source path< ./dogcontract2.wasm --abi dogcontract2.abi-p inline@active

#you can check if u want
cleos get table inline bob balances
cleos transfer bob inline "200 DOGCOIN" "memo" -p bob@active
cleos get table inline payable balances
 */



