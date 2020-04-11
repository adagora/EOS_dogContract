ScatterJS.plugins( new ScatterEOS() );
//> python -m SimpleHTTPServer 80
const network = ScatterJS.Network.fromJson({
    blockchain:'eos',
    //> curl http://localhost:8888/v1/chain/get_info
    chainId:'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',     
    host:'127.0.0.1',
    port:8888,
    protocol:'http'
});

const contractConfig = {
  code: "dogcontract2",
  scope: "dogcontract2",
  dogTableName: "dogs",
  balancesTableName: "balances",
  symbol: "DOGCOIN"
}

var eos;
var rpc;
var account;

ScatterJS.connect('DogDap', {network}).then(connected => {
  if (!connected) return alert("NO SCATTER DETECTED");
  console.log("scatter connected");

  const scatter = ScatterJS.scatter;
  //none can acces scatter through the windows
  windows.ScatterJS = null;     

  scatter.login({accounts: [network]}).then(function(){
    account = scatter.account('eos');
    //get dogs
    rpc = new eosjs_jsonrpc.JsonRpc(network.fullhost());
    //add dog
    eos = scatter.eos(network, eosjs_api.Api, {rpc}); 

    getDogs();
    getBalances();
  });

});

function getDogs(){
  rpc.get_table_rows({
    json: true,
    code: contractConfig.code,
    scope: contractConfig.scope,
    table: contractConfig.dogTableName,
    index_position: 2,
    key_type: "name",
    //from scatter
    lower_bound: account.name,              
    upper_bound: account.name,
  }).then(function(res){
    console.log(res);
    populateDogList(res.rows);
  })
}
function getBalances(){
  rpc.get_table_rows({
    json: true,
    code: contractConfig.code,
    scope: account.name,
    table: contractConfig.balancesTableName,
  }).then(function(res){
    console.log(res);
    populateBalancelist(res.rows);
  })
}

function populateDogList(dogs){
  // auto refresh(do not duplicate list)
  $("#doglist").empty();
  //created in HTML
  var ul = document.getElementById("doglist"); 
  for (var i = 0; i < dogs.length; i++){
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(dogs[i].id + ": " + dogs[i].dog_name + ", " + dogs[i].age));
    //add to list
    ul.appendChild(li);       

}
}
function populateBalanceList(balances){
  // auto refresh(do not duplicate list)
  $("#balance_list").empty(); 
  //created in HTML
  var ul = document.getElementById("balance_list"); 
  for (var i = 0; i < balances.length; i++){
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(balances[i].funds));
    //add to a list
    ul.appendChild(li);       

  }
}
function(addDog){
  var dogName = $("#dog_name").val();
  var dogAge = $("#dog_age").val();

// Details about transaction, content
  eos.transact(){
    actions: [{
      account: contractConfig.code,
      name: 'insert',
      // from scatter authorization
      authorization: [{     
        actor: account.name,
        permission: account.authority
      }],
      data:{
        owner: account.name,
        dog_name: dogName, 
        age: dogAge,
      },
  }]
  }, { 
  //standards 3 block behind
  blocksBehind: 3,
  expireSeconds: 30
  }).then(function(res){
  //Successfull add
    getDogs();
    getBalances();
    console.log(res);
  }).catch(function(err){
    alert('error: ', err);
  })
}
  function(removeDog){
  var dogId = $("#dog_id").val();
// Details about transaction, content
  eos.transact(){
    actions: [{
      account: contractConfig.code,
      name: 'erase',
      // from scatter authorization
      authorization: [{     
        actor: account.name,
        permission: account.authority
      }],
      data:{
        dog_id: dogId
      },
  }]
  }, { //standards 3 block behind
  blocksBehind: 3,
  expireSeconds: 30
  }).then(function(res){
  //Successfull add
    getDogs();
    console.log(res);
  }).catch(function(err){
    alert('error: ', err);
  })
}

  function(removeAllMyDog){

// Details about transaction, content
  eos.transact(){
    actions: [{
      account: contractConfig.code,
      name: 'removeall',
      // from scatter authorization
      authorization: [{     
        actor: account.name,
        permission: account.authority
      }],
      data:{
        user: account.name
      }
  }]
}

}, { 
  //standards 3 block behind
  blocksBehind: 3,
  expireSeconds: 30
}).then(function(res){
  //Successfull add
  getDogs();
  console.log(res);
}).catch(function(err){
  alert('error: ', err);
})
}

  function depositCoins(){
    var quantity= $("#deposit_value").val();
    var asset=quantity + " " + contractConfig.symbol;
// Details about transaction, content
  eos.transact(){
    actions: [{
      account: 'eosio.token',
      name: 'transfer',
      // from scatter authorization
      authorization: [{     
        actor: account.name,
        permission: account.authority
      }],
      data:{
        from: account.name,
        to: contractConfig.code,
        quantity: asset,
        memo:"DogDapp Deposit"
      },
  }]
  }, { 
  //standards 3 block behind
  blocksBehind: 3,
  expireSeconds: 30
  }).then(function(res){
  //Successfull add
    getBalances();
    console.log(res);
  }).catch(function(err){
    alert('error: ', err);
  })
}

$(document).ready(function() {
  $("#add_dog_button").click(addDog);
  $("#erase_dog_button").click(removeDog);
  $("#removeallmy_dog_button").click(removeAllMyDog);
  $("depositButton").click(depositCoins);

});
