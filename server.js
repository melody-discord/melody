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
  // gvg出欠確認にリアクションを付ける
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
  
  // メンションで呼ばれた時は使用方法を表示
  if (message.isMemberMentioned(client.user)) {
    console.log(message.channel.name);
    let arr = ["ん？呼んだ？", "はーい♡", "...", "起きてるよ", "うるせぇな"];
    var random = Math.floor(Math.random() * arr.length);
//    var result = arr[random];
    var result = arr[random] + '\n\n【戦闘力報告関連】\n !cp';
    sendReply(message, result);
    return;
  }
  //===================================
  //debug用チャンネル以外は処理しない
  if (message.channel.id != process.env.DISCORD_BOT_TEST_CH) return;
  //===================================
    
  //コマンド関連
  if (message.content.startsWith(prefix)){
    const args = message.content.slice(prefix.length).trim().split(' ');
    const cmd = args.shift().toLowerCase();
    //Usage
    if (cmd ==='cp' && (args[0] === 'help' || args[0] === undefined) ){
      console.log('HELP');
      let text = "\n【報告用】!cp 戦闘力 ジョブ\n"
      + "　　　  　`!cp 1234567 パラ`　という感じで入力してください。\n\n"
      + "　※!cpと区切りのスペースは半角でお願いします。\n"
      + "　　数字はカンマで区切らないでください。\n\n"
      + "　※何度でも入力可能です。間違えたら再度入力してください。\n"
      + "　　後から入力したもので上書きします。\n\n\n"
      + "【設定用】`!cp reset`：現在のチャンネルに報告用のメッセージを作成します。\n\n"
      + "　※集計する人が行いますので通常は使いません。\n"
      + "　※このコマンドが入力されるとメンションが行きますので早めに報告しましょう。\n";
      sendMsg(message.channel.id, text);
      return;
    }
    // reset データを初期化して報告用のメッセージ送信
    if (cmd ==='cp' && args[0] === 'reset' ){
      console.log('RESET');
      let text = "@everyone" + "\n戦闘力の報告をお願いします！\n" 
               + "【入力方法】!cp 戦闘力 ジョブ\n （例）`!cp 1234567 パラ`" 
               + "\n-----------------------------------------";
      console.log("ch:" + message.channel.id);
      console.log("me:" + message.id);
      sendMsgAndLog(message.channel.id, text);
      clearAllCPData();
      return;
    }
    
    // 報告時の処理
    if (cmd ==='cp' && args[0] !== undefined){
      //設定・データの読み込み
      var fs = require('fs');
      var jsonCpConfig = JSON.parse(fs.readFileSync('./config.json','utf8'));
      var result = {};
      var jsonMemData = JSON.parse(fs.readFileSync('./cpdata.json','utf8'));
      var result = {};
      //投稿者のニックネーム（設定なしは名前）
      let nname = message.member.nickname;
      if(nname == null) {
        nname = message.author.username;
      };

      //投稿者が既に報告済みか判定      
      let passIndex = jsonMemData.members.findIndex(function(item){
                                     return item.id == message.author.id;
                                     });
      console.log('index:' + passIndex);
      //該当IDがなければ追加、あれば更新
      if (passIndex === -1) {
        let new_data = {id: message.author.id,
                        name: nname,
                        cp: args[0],
                        job: args[1]
                       };
        jsonMemData.members.push(new_data);
        console.log('newdata: ' + JSON.stringify(new_data));
      } else {
        console.log('else: ' + passIndex);
        jsonMemData.members[passIndex].name = nname;
        jsonMemData.members[passIndex].cp = args[0];
        jsonMemData.members[passIndex].job = args[1];
      }
      console.log('memdata: ' + JSON.stringify(jsonMemData))
      fs.writeFileSync('cpdata.json', JSON.stringify(jsonMemData),"utf8");
      
      //報告による投稿はメンションを付けない
      let text = "\n戦闘力の報告をお願いします！\n" 
         + "【入力方法】!cp 戦闘力 ジョブ\n （例）!cp 1234567 パラ" 
         + "\n-----------------------------------------";
      
      jsonMemData.members.forEach(function(item,index){
                  if (index !== 0){
                      text += '\n"' + item.name + '", ' + item.cp + ', "' + item.job + '"'
                      console.log('text:' + text);
                  } 
            });

      console.log(jsonCpConfig.channel, jsonCpConfig.message, JSON.stringify(jsonCpConfig));
      //元の投稿を編集するパターン
      //client.channels.get(jsonCpConfig.channel).fetchMessage(jsonCpConfig.message).then(message => message.edit(text));
      let oldchannel = jsonCpConfig.channel;
      let oldmessage = jsonCpConfig.message;
      //報告結果を新規投稿する
      sendMsgAndLog(message.channel.id, text);
      
      
      //※↓様子をみて実装する
      
      //旧データを削除する
      //client.channels.get(oldchannel).fetchMessage(oldmessage).then(message => message.delete());
      return;
  }
  
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
  //全データ削除のため[0]はダミーデータとする
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