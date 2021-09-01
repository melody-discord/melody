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

  if (message.content.match('!cp help')){
    let text = "【設定】!cp reset：現在のチャンネルに報告用のメッセージを作成します\n"
             + "【報告】!cp 戦闘力 ジョブ （例）!cp 1234567 パラ";
    sendMsg(message.channel.id, text);
    return;
  }
  if (message.content.match('!cp reset')){
    let text = "戦闘力の報告をお願いします！\n" 
             + "【入力方法】!cp 戦闘力 ジョブ （例）!cp 1234567 パラ" 
             + "\n-----------------------------------------";
    process.env.DISCORD_BOT_CHID = message.channel.id;
    console.log("ch:" + message.channel.id);
    console.log("me:" + message.id);
    sendMsgAndLog(message.channel.id, text);
    process.env.DISCORD_BOT_MEID = message.id;
    return;
  }

  
  //  if (message.content.match(/にゃ～ん|にゃーん/)){
  //    let text = "にゃ～ん";
  //    sendMsg(message.channel.id, text);
  //    return;
  //  }
  //  if (message.content.match('やぁ')){
  //    let text = "L「使用許可取った？」";
  //    sendMsg(message.channel.id, text);
  //    return;
  //  }
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
    .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}
async function sendMsgAndLog(channelId, text, option = {}) {
  let sent = await client.channels
    .get(channelId)
    .send(text, option)
    .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
  let id = sent.id;
  writeCPConfig(channelId, id);
  console.log(id);
}

function writeCPConfig(channelId, messageId){
  const fs = require('fs');
  const path = require('path');

//  const jsonObject = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
//  const result = {};
  let data = {
    channel: channelId,
    message: messageId
  };
  console.log(data);
  fs.writeFileSync('./config.json', JSON.stringify(data));
}