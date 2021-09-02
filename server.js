const http = require("http");
const querystring = require("querystring");
const discord = require("discord.js");
require("discord-reply");//必ずこの位置に追加
const client = new discord.Client();

http
  .createServer(function(req, res) {
    if (req.method == "POST") {
      var data = "";
      req.on("data", function(chunk) {
        data += chunk;
      });
      req.on("end", function() {
        if (!data) {
          res.end("No post data");
          return;
        }
        var dataObject = querystring.parse(data);
        console.log("post:" + dataObject.type);
        if (dataObject.type == "wake") {
          console.log("Woke up in post");
          res.end();
          return;
        }
        res.end();
      });
    } else if (req.method == "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Discord Bot is active now\n");
    }
  })
  .listen(3000);

client.on("ready", message => {
  console.log("Bot準備完了～");
  client.user.setPresence({ activity: { name: "監視中" }, status: "online" });
});

client.on("message", message => {
  const prefix = "!";
  
  if (message.author.id == client.user.id) {
    return;
  }
  // author.idはwebhookの最初の数字18桁
  if (message.author.id == process.env.DISCORD_BOT_ID01 ||
      message.author.id == process.env.DISCORD_BOT_ID02) {
    console.log(message.author.id + ":" + message.author.username);
    message.react("⭕");
    message.react("❌");
    message.react("❓");
    message.react("🎤");
    message.react("👂");
    message.react("😭");
    return;
  }
  if (message.isMemberMentioned(client.user)) {
    console.log(message.channel.name);
    let arr = ["ん？呼んだ？", "はーい♡", "...", "起きてるよ", "うるせぇな"];
    var random = Math.floor(Math.random() * arr.length);
    var result = arr[random];
//    var result = arr[random] + '\n\n【使い方】\n !cp 1234567 パラ';
    sendReply(message, result);
    return;
  }
  //=================================================================
  //DEBUG MODE
  if (message.channel.id != process.env.DISCORD_BOT_TEST_CH) return;
  //=================================================================
  
  if (message.content.startsWith(prefix)){
    const args = message.content.slice(prefix.length).trim().split(' ');
    const cmd = args.shift().toLowerCase();

    if (cmd ==='cp' && (args[0] === 'help' || args[0] === undefined) ){
      console.log('HELP');
      let text = "【設定】!cp reset：現在のチャンネルに報告用のメッセージを作成します\n"
               + "【報告】!cp 戦闘力 ジョブ （例）!cp 1234567 パラ";
      sendMsg(message.channel.id, text);
      return;
    }
    if (cmd ==='cp' && args[0] === 'reset' ){
      console.log('RESET');
//      let text = ""<@everyone>" + 戦闘力の報告をお願いします！\n" 
      let text = "@everyone" + "\n戦闘力の報告をお願いします！\n" 
               + "【入力方法】!cp 戦闘力 ジョブ\n （例）!cp 1234567 パラ" 
               + "\n-----------------------------------------";
      console.log("ch:" + message.channel.id);
      console.log("me:" + message.id);
      sendMsgAndLog(message.channel.id, text);
      clearAllCPData();
      return;
    }
    
    // メッセージ更新の実装
    if (cmd ==='cp' && args[0] !== undefined){
      
      var fs = require('fs');
      var jsonCpConfig = JSON.parse(fs.readFileSync('./config.json','utf8'));
      var result = {};
      var jsonMemData = JSON.parse(fs.readFileSync('./cpdata.json','utf8'));
      var result = {};
      
      //client.user.id
    　var memdata = jsonMemData.members.filter(function(item){
                                     return item.id == message.author.id;
                                     });
      //ヒットしない場合は作成
      if (memdata.length == 0) {
        let new_data = {id: message.author.id,
                        name: message.author.username,
                        cp: args[0],
                        job: args[1]
                       };
        jsonMemData.members.push(new_data);
        console.log('newdata: ' + JSON.stringify(new_data))
        console.log('memdata: ' + JSON.stringify(jsonMemData))
        fs.writeFileSync('cpdata.json', JSON.stringify(jsonMemData),"utf8");
      }

      console.log('memdata:' + memdata + memdata.length);
      
      console.log(jsonCpConfig.channel, jsonCpConfig.message, JSON.stringify(jsonCpConfig));

      client.channels.get(jsonCpConfig.channel).fetchMessage(jsonCpConfig.message).then(message => message.edit("new message"));
      //const msg = client.get_channel(jsonObject.channel).messages.fetch(jsonObject.message);
      //console.log(msg);
      //console.log(client.channels.cache.get(jsonObject.channel).fetchMessage(jsonObject.message))
    }
    return;
  }
  
  
  
});

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);

function sendReply(message, text) {
  message
    .reply(text)
    .then(console.log("リプライ送信: " + text))
    .catch(console.error);
}

function sendMsg(channelId, text, option = {}) {
  client.channels
    .get(channelId)
    .send(text, option)
    .then(console.log("sendMsg  CH:" + channelId + " メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}
async function sendMsgAndLog(channelId, text, option = {}) {
  let sent = await client.channels
    .get(channelId)
    .send(text, option)
    .then(console.log("sendMsgAndLog  CH:" + channelId + " メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
  let id = sent.id;
  writeCPConfig(channelId, id);
}

function writeCPConfig(channelId, messageId){
  const fs = require('fs');

  let data = {
    channel: channelId,
    message: messageId
  };
  console.log('writeCPConfig:' + data);
  fs.writeFileSync('config.json', JSON.stringify(data),"utf8");
}

function clearAllCPData(){
  const fs = require('fs');

  let data = {
    "members": [{id: "000000000000000000",
                        name: "No Name",
                        cp: 1234567,
                        job: "para"
                       }]
    };
  console.log('clearAllCPData:' + data);
  fs.writeFileSync('cpdata.json', JSON.stringify(data),"utf8");
}

function getJsonCpData(){
  
}