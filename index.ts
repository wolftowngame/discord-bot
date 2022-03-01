const fs = require('fs');
const BOT_TOKEN = fs.existsSync('.discord') ? fs.readFileSync('.discord').toString().trim() : '';
import { Client, Intents, MessageActionRow, MessageAttachment, MessageButton, MessageEmbed, TextChannel } from 'discord.js';
import axios, { Axios } from 'axios';
import { providers, Contract, BigNumber, ethers } from 'ethers';
const StaticWeb3Read = new providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
let db: { lastBlock: number; WatchList: Record<string, string[]> } = {} as any;
try {
  db = require('./db.json');
} catch (e) {
  //
} finally {
  db.lastBlock = db.lastBlock || 0;
  db.WatchList = db.WatchList || {};
}

const dbSave = () => {
  fs.writeFile('./db.json', JSON.stringify(db), () => {});
};
const Wolf = new Contract('0xE686133662190070c4A4Bea477fCF48dF35F5b2c', require('./Wolf.json'), StaticWeb3Read);
const Barn = new Contract('0x58eaBB38cc9D68bEA8E645B0f5Ec741C82f2871B', require('./Barn.json'), StaticWeb3Read);
const BarnBUG = new Contract('0x386500b851CA1aF027247fa8Ab3A9dDd40753813', require('./Barn.json'), StaticWeb3Read);
const Wool = new Contract('0xAA15535fd352F60B937B4e59D8a2D52110A419dD', require('./ERC20.json'), StaticWeb3Read);
const Milk = new Contract('0x60Ca032Ba8057FedB98F6A5D9ba0242AD2182177', require('./ERC20.json'), StaticWeb3Read);

const AddressTranslate: Record<string, string> = {
  [Wolf.address]: 'WolfTown',
  [Barn.address]: 'Barn',
};

const client = new Client({
  intents: [Intents.FLAGS.GUILD_MESSAGES],
});

const WatchList = (db.WatchList = db.WatchList || {});
let cmds = ['MINT', 'Barn-UNSTAKE', 'STAKE-MILK', 'STAKE-WOOL', 'STAKE-WOLF', 'STOLEN'];
Wolf.interface.fragments.forEach((it) => {
  if (cmds.includes(it.name)) return;
  cmds.push(it.name);
});
Barn.interface.fragments.forEach((it) => {
  if (cmds.includes(it.name)) return;
  cmds.push('Barn-' + it.name);
});
cmds = cmds.filter((i) => i);
const testCid = '947753505844760607';
WatchList[testCid] = cmds;

client.once('ready', () => {
  if (!client.user) return;
  console.log(`Logged in as ${client.user.tag}!`);
});
client.on('error', (msg) => console.log('error:', msg));

client.on('messageCreate', async (msg) => {
  console.log(msg, msg.content);
  const bot = client.user!;
  const from = msg.author;
  if (from.id === bot.id) return;
  const botWasMentioned = msg.mentions.users.find((mentionedUser) => mentionedUser.id === bot.id);

  if (botWasMentioned) {
    WatchList[msg.channelId] = WatchList[msg.channelId] || [];
    const add = msg.content.trim().match(/add\:(.*)$/);
    if (add) {
      const event = add[1];
      if (!cmds.includes(event)) return;

      if (WatchList[msg.channelId].includes(event)) {
        msg.channel.send('Already registered');
        return;
      }

      WatchList[msg.channelId].push(event);
      msg.channel.send('Successful');
      dbSave();
      return;
    }

    const del = msg.content.trim().match(/del\:(.*)$/);
    if (del) {
      const event = del[1];
      if (!cmds.includes(event)) return;
      if (WatchList[msg.channelId].includes(event)) WatchList[msg.channelId].splice(WatchList[msg.channelId].indexOf(event), 1);
      msg.channel.send('Successful');
      dbSave();
      return;
    }

    msg.channel.send(WatchList[msg.channelId].join(';'));
    return;
  }
});

client.login(BOT_TOKEN);

const defaultDvt = {
  name: '',
  message: [{ type: '', content: '' }],
};
const ChannelCache: Record<string, Promise<TextChannel>> = {};
const TokenInfoReqCache: Record<string, Promise<Wolf>> = {};
const TokenInfoCache: Record<string, Wolf> = {};

const emitEvent = (tx: providers.TransactionResponse, evt = [defaultDvt]) => {
  for (const id in db.WatchList) {
    const watchs = db.WatchList[id];
    if (watchs.length === 0) continue;
    let con = '';
    if (tx.to === Barn.address) con = 'Barn-';
    const evts = evt.filter((e) => watchs.includes(con + e.name));
    if (evts.length === 0) continue;
    if (!ChannelCache[id]) ChannelCache[id] = client.channels.fetch(id) as Promise<TextChannel>;
    ChannelCache[id].then((ch) => {
      const getMsg = () => {
        const tokenIds: string[] = [];
        const row = new MessageActionRow();
        const embed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`IN: ${tx.blockNumber}`)
          .setAuthor({ name: `FROM: ${showAddress(tx.from, false)}` })
          .setURL(`https://bscscan.com/tx/${tx.hash}`)
          // .addFields(
          //   // { name: '\u200B', value: '\u200B' },
          //   { name: 'Inline field title', value: 'Some value here', inline: true },
          //   { name: 'Inline field title', value: 'Some value here', inline: true },
          // )
          // .addField('Inline field title', 'Some value here', true)
          // .setImage('https://i.imgur.com/AfFp7pu.png')
          .setTimestamp()
          .setFooter({ text: 'Bug and suggestion, contact @imconfig', iconURL: 'https://avatars.githubusercontent.com/u/2430646?v=4' });
        const btns: Record<string, boolean> = {
          [ethers.constants.AddressZero]: true,
        };

        btns[tx.from] = true;
        row.addComponents(new MessageButton({ label: `from: ${showAddress(tx.from)}`, style: 'LINK', url: `https://bscscan.com/address/${tx.from}` }));

        btns[tx.to!] = true;
        row.addComponents(new MessageButton({ label: `to: ${showAddress(tx.to!)}`, style: 'LINK', url: `https://bscscan.com/address/${tx.to}` }));

        let desc: string[] = [];
        evts.forEach((e) => {
          const contents: string[] = [];
          e.message.map((s) => {
            if (s.type === 'tokenId' && !tokenIds.includes(s.type)) {
              tokenIds.push(s.content);
            }
            if (!btns[s.content] && Object.keys(btns).length < 6 && ethers.utils.isAddress(s.content)) {
              btns[s.content] = true;
              row.addComponents(new MessageButton({ label: `${showAddress(s.content)}`, style: 'LINK', url: `https://bscscan.com/address/${s.content}` }));
            }
            contents.push(`${s.type}:${showAddress(s.content)}`);
          });
          // embed.addField(e.name, contents.join(' '), true);
          desc.push(`[${e.name}]:${contents.join(' ')}`);
        });

        const tokens = tokenIds
          .filter((i) => TokenInfoCache[i])
          .map((id) => {
            const wolf = TokenInfoCache[id];
            const type = getWolfAttr('type', wolf);
            if (type === 'Wolf') return `#${wolf.name}(${getWolfAttr('alpha', wolf)})`;
            return `#${wolf.name}`;
          });
        embed.setDescription(desc.join('\r\n') + tokens.join('\r'));
        return { msg: { content: `TO: ${showAddress(tx.to!, false)}`, embeds: [embed], components: [row] }, tokenIds };
      };
      const send = getMsg();
      const needAwait = send.tokenIds.filter((t) => !TokenInfoCache[t]);
      ch.send(send.msg).then(async (msg) => {
        if (needAwait.length === 0) return;
        await Promise.all(
          needAwait.map((token) => {
            if (token in TokenInfoReqCache) return TokenInfoReqCache[token];
            TokenInfoReqCache[token] = getAniJSON(`https://app.wolftown.world/animals/${token}`).then((wolf) => {
              TokenInfoCache[token] = wolf;
              return wolf;
            });
          })
        );
        msg.edit(getMsg().msg);
      });
    });
  }
};

const getWolfAttr = (name: string, wolf: Wolf) => {
  const res = wolf.attributes.find((i) => i.trait_type === name);
  if (!res) return '';
  return res.value;
};
interface Wolf {
  attributes: Array<{ trait_type: string; value: string }>;
  description: string;
  image: string;
  imageSmall: string;
  name: string;
}
const getAniJSON = async (uri: string): Promise<Wolf> => {
  const res = await axios.get(uri);
  return res.data;
};

function showAddress(address: string, s = true) {
  const res = AddressTranslate[address] || address;
  if (!s) return res;
  if (ethers.utils.isAddress(res)) return AddressShortString(res);
  return res;
}
function AddressShortString(address: string) {
  return address.replace(/(0x[0-9a-zA-Z]{4})(.*?)([0-9a-zA-Z]{4})$/, '$1...$3');
}

const NumTrue: any = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

const txCache: Record<string, boolean> = {};
(async () => {
  const query = async () => {
    try {
      const res = await Wolf.queryFilter({}, (-30 * 60) / 3, 'latest');
      const adds: { tx: string; key: string }[] = [];
      const txCacheMap: Record<string, typeof adds[0]> = {};
      res.forEach((item) => {
        if (item.blockNumber <= db.lastBlock) return;
        db.lastBlock = item.blockNumber;
        const key = item.transactionHash + item.logIndex;
        if (txCache[key]) return;
        txCache[key] = true;
        if (item.event !== 'Transfer' && item.event !== 'TokenStolen') return;
        if (!txCacheMap[item.transactionHash]) {
          txCacheMap[item.transactionHash] = { tx: item.transactionHash, key };
          adds.push(txCacheMap[item.transactionHash]);
        }
        // const transferData = txCacheMap[item.transactionHash];
      });

      for (const msg of adds) {
        try {
          const [tx, rtx] = await Promise.all([StaticWeb3Read.getTransaction(msg.tx), StaticWeb3Read.getTransactionReceipt(msg.tx)]);
          let res: ReturnType<typeof Wolf.interface.parseTransaction> | null;
          if (tx.to === Wolf.address) {
            res = Wolf.interface.parseTransaction(tx);
          } else if (tx.to === Barn.address) {
            res = Barn.interface.parseTransaction(tx);
          } else {
            res = null;
          }
          const message = res
            ? [
                {
                  name: res.name,
                  message: [
                    { type: 'from', content: tx.from },
                    { type: 'to', content: tx.to! },
                  ],
                },
              ]
            : [];
          rtx.logs.forEach((log) => {
            let parse: ReturnType<typeof Wolf.interface.parseLog>;
            if (log.address === Wolf.address) {
              parse = Wolf.interface.parseLog(log);
            } else if (log.address === Barn.address) {
              parse = Barn.interface.parseLog(log);
            } else {
              return;
            }
            const evt = {
              name: parse.name,
              message: [] as { type: string; content: string }[],
            };
            for (const i in parse.args) {
              if (NumTrue[i]) continue;
              const content = parse.args[i];
              if (typeof content === 'string') {
                evt.message.push({ type: i, content: content });
              } else if (content instanceof BigNumber) {
                evt.message.push({ type: i, content: content.toString() });
              } else {
                evt.message.push({ type: i, content: content.toString() });
              }
            }
            message.push(evt);
          });
          emitEvent(tx, message);
        } catch (e) {
          console.error('send msg err', e);
        }
      }
      dbSave();
    } catch (e) {
      console.log('e', e);
    } finally {
      //
    }
  };

  while (true) {
    console.log('lastBlock', db.lastBlock);
    await query();
    await sleep(3000);
  }
})();
function sleep(t = 100) {
  return new Promise((resolve) => setTimeout(resolve, t));
}
