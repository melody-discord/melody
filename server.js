const http = require('http');
const querystring = require('querystring');
const discord = require('discord.js');
const client = new discord.Client();

http.createServer(function(req, res){
  if (req.method == 'POST'){
    var data = "";
    req.on('data', function(chunk){
      data += chunk;
    });
    req.on('end', function(){
      if(!data){
        res.end("No post data");
        return;
      }
      var dataObject = querystring.parse(data);
      console.log("post:" + dataObject.type);
      if(dataObject.type == "wake"){
        console.log("Woke up in post");
        res.end();
        return;
      }
      res.end();
    });
  }
  else if (req.method == 'GET'){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Discord Bot is active now\n');
  }
}).listen(3000);

client.on('ready', message =>{
  console.log('Bot準備完了～');
  client.user.setPresence({ activity: { name: 'げーむ' } });
});

client.on('message', message =>{
  if (message.author.id == client.user.id){
    return;
  }
  // author.idはwebhookの最初の数字
  if (message.author.bot && message.author.id == '875191973559038033'){
    console.log(message.author.id + ":" + message.author.username);
    message.react('⭕');
    message.react('❌');
    message.react('❓');
    message.react('🎤');
    message.react('👂');
    message.react('😭');
    return;
  }
  if(message.isMemberMentioned(client.user)){
    sendReply(message, "ん？呼んだ？");
    return;
  }
  if (message.content.match(/にゃ～ん|にゃーん/)){
    let text = "にゃ～ん";
    sendMsg(message.channel.id, text);
    return;
  }
  if (message.content.match('やぁ')){
    let text = "L「使用許可取った？」";
    sendMsg(message.channel.id, text);
    return;
  }
});

if(process.env.DISCORD_BOT_TOKEN == undefined){
 console.log('DISCORD_BOT_TOKENが設定されていません。');
 process.exit(0);
}

client.login( process.env.DISCORD_BOT_TOKEN );

function sendReply(message, text){
  message.reply(text)
    .then(console.log("リプライ送信: " + text))
    .catch(console.error);
}

function sendMsg(channelId, text, option={}){
  client.channels.get(channelId).send(text, option)
    .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}
