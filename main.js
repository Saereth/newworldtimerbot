import { config as dotenv } from "dotenv";
import { readFileSync, createReadStream } from "fs";
import { join } from 'path';

//import { config } from './config.json';

dotenv();

import { Client, Intents, VoiceChannel } from "discord.js";

import { joinVoiceChannel, VoiceConnectionStatus, getVoiceConnection, createAudioPlayer, createAudioResource,AudioPlayerStatus,StreamType  } from "@discordjs/voice";
import path from 'path';
const __dirname = path.resolve();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGE_TYPING] });

const TextChannelIDs = ['765778651043332110'];
const VoiceChannelID = '765778651043332111';
const ServerID = '765778651043332107';
const TrustedRoles = ['889769455171797032'];


const audioPlayer = createAudioPlayer();

let soundResetNow = createAudioResource(join(__dirname,'resetnow.mp3'), { inlineVolume: true });
soundResetNow.volume.setVolume(.9);

let soundResetWarn = createAudioResource(join(__dirname, '5minwarning.mp3'), { inlineVolume: true })
soundResetWarn.volume.setVolume(.9);

console.log('Bot Loaded')


function sendToChannels(text){
    TextChannelIDs.forEach(function(channelid){
        sendToTextChannel(text,channelid);
      })
}

async function sendToTextChannel(text,channelid){
    const channel = await client.channels.fetch(channelid);
    channel.send(text);
}



client.once('ready', () => {
    sendToChannels('New World Timer Bot is online. Current countdown set to 30 minutes.');
    console.log('Bot Online')
})

client.on("ready", async () => {
    const vChan = await client.channels.fetch(VoiceChannelID) 
    const guild = await vChan.client.guilds.fetch(ServerID)
      
    const connection = joinVoiceChannel({
        channelId: VoiceChannelID,
        guildId: ServerID,
        adapterCreator: guild.voiceAdapterCreator,
        });

    const subscription = connection.subscribe(audioPlayer);


})


audioPlayer.on(AudioPlayerStatus.Playing, () => {
    console.log("currently playing");
    console.log("resource started:", soundResetNow.started);
});

audioPlayer.on('error', error => {
    console.error(`Error: ${error.message} with resource ${error.soundResetNow.metadata.title}`);
});

audioPlayer.on(AudioPlayerStatus.AutoPaused, () => {
    console.log("done");
    
});



function isTrustedUser (user, author){
    let trusted = false;
    if (author.tag == 'Saereth#7836')
      trusted = true;

    TrustedRoles.forEach(function(roleID){
        if (user.roles.cache.has(roleID))
            trusted = true;
      })

      return trusted;   
}


var timer = -1; // 30 minutes
console.log('Initial Timer set to off')

setInterval(function () {
    
    if (timer > 0){
        timer -= 15000;
        //console.log("NW Timer Bot: " + Math.round((timer/1000/60)) + " Minutes until townboard reset.");
        if (timer == 0){
            sendToChannels('Town Board Timer is Resetting NOW!');
            audioPlayer.play(soundResetNow);  
            timer = 1800000;
        }
        if (timer == 300000){
            sendToChannels('Town Board Resetting in 5 Minutes!');
            audioPlayer.play(soundResetWarn);  

        }
    }

}, 15000)

client.on("messageCreate", message => {
    if (message.author.bot) return;
    
    let trusted = isTrustedUser(message.member, message.author);

    const args = message.content.slice(1).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
  
    if(command === 'newt') {
        let subCommand = args[0];
        let param = args[1];

        if (!trusted){
            message.channel.send('You are not authorized to use this bot.');
        }
        else{
            switch (subCommand) {
                case "setTimer" :
                    if (!isNaN(param) && param > 0 && param < 1440){
                    timer = param*60*1000; //convert to ms
                    message.channel.send('Board Timer Updated to: ' + param +  " minutes");
                    }
                    else {
                        message.channel.send('Board Timer must be between 1 and 1440 minutes');
                    }
                   break;
                case "stopTimer" :
                  timer = -1;
                  message.channel.send('Board Timer Stopped.');
                  break;
                case "status" :
                    if (timer < 0)
                    message.channel.send('Board Timer is not currently running.');
                    else
                    message.channel.send('Board Timer\'s Current Time until reset is: ~' + Math.round((timer/1000)/60));
                    break;
                case "help" :
                    message.channel.send('subCommands are: \nsetTimer parameter - Sets the timer; parameter is time in second\nstopTimer - Stops the Timer.\nstatus - displays the current countdown value of the timer in minutes.');
                    break;
              }
        }
    } 
  });

  client.login(process.env.DJS_TOKEN);
//  client.login(config.token);