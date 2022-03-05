const fs = require('fs');
const BOT_TOKEN = fs.existsSync('.discord') ? fs.readFileSync('.discord').toString().trim() : '';
import { Awaitable, Client, Intents, Message, MessageActionRow, MessageAttachment, MessageButton, MessageEmbed, TextChannel } from 'discord.js';
import axios, { Axios } from 'axios';
import { providers, Contract, BigNumber, ethers } from 'ethers';
const StaticWeb3Read = new providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
let db: { lastBlock: number; WatchList: Record<string, string[]> } = {} as any;

const AdminUser = ['885409915055775754'];
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
const Wolf = new Contract('0x14f112d437271e01664bb3680BcbAe2f6A3Fb5fB', require('./Wolf.json'), StaticWeb3Read);
const Barn = new Contract('0x10A6DC9fb8F8794d1Dc7D16B035c40923B148AA4', require('./Barn.json'), StaticWeb3Read);
const Rescue = new Contract('0xCe487D0Ab195D28FE18D5279B042498f84eb051F', require('./Barn.json'), StaticWeb3Read);
const Wool = new Contract('0xAA15535fd352F60B937B4e59D8a2D52110A419dD', require('./ERC20.json'), StaticWeb3Read);
const Milk = new Contract('0x60Ca032Ba8057FedB98F6A5D9ba0242AD2182177', require('./ERC20.json'), StaticWeb3Read);

const AddressTranslate: Record<string, string> = {
  [Wolf.address]: 'WolfTown',
  [Barn.address]: 'Barn',
  [Rescue.address]: 'Rescue',
};

const client = new Client({
  intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
});

const WatchList = (db.WatchList = db.WatchList || {});
let cmds = ['MINT', 'Unknown', 'Barn-UNSTAKE', 'STAKE-MILK', 'STAKE-WOOL', 'STAKE-WOLF', 'STOLEN', 'TokenStolen'];
// Wolf.interface.fragments.forEach((it) => {
//   if (cmds.includes(it.name)) return;
//   cmds.push(it.name);
// });
// Barn.interface.fragments.forEach((it) => {
//   if (cmds.includes(it.name)) return;
//   cmds.push('Barn-' + it.name);
// });
cmds = cmds.filter((i) => i);
const testCid = '947753505844760607';
WatchList[testCid] = cmds;

client.once('ready', () => {
  if (!client.user) return;
  console.log(`Logged in as ${client.user.tag}!`);
});
client.on('error', (msg) => console.log('error:', msg));

const MessageWatch: (message: Message<boolean>) => Awaitable<void> = async (msg) => {
  console.log('messageCreate', msg.channelId);
  const bot = client.user!;
  const from = msg.author;
  if (from.id === bot.id) return;
  const botWasMentioned = msg.mentions.users.find((mentionedUser) => mentionedUser.id === bot.id);

  if (botWasMentioned && AdminUser.includes(from.id)) {
    WatchList[msg.channelId] = WatchList[msg.channelId] || [];
    const matchd = msg.content.trim().match(/cmd\:(.*)$/);
    if (!matchd) return;
    const want = parseMsg(matchd[1]);
    if (want.add) {
      const event = want.add;
      if (!cmds.includes(event)) return;

      const to = msg.channelId || want.id;
      if (WatchList[to].includes(event)) {
        msg.channel.send('Already registered');
        return;
      }

      WatchList[to].push(event);
      msg.channel.send('Successful');
      dbSave();
      return;
    }

    if (want.del) {
      const event = want.del;
      if (!cmds.includes(event)) return;
      const to = msg.channelId || want.id;
      if (WatchList[to].includes(event)) WatchList[to].splice(WatchList[to].indexOf(event), 1);
      msg.channel.send('Successful');
      dbSave();
      return;
    }

    if (want.pub) {
      const cid = want.pub;
      client.channels.fetch(cid).then((ch) => {
        if (ch) (ch as TextChannel).send('Hello!');
      });
    }

    msg.channel.send(WatchList[msg.channelId].join(';'));
    return;
  }
};
client.on('messageCreate', MessageWatch);

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
          e.message.forEach((s) => {
            if (['tokenId', 'tokenId__'].includes(s.type) && !tokenIds.includes(s.content)) {
              tokenIds.push(s.content);
            }
            if (s.type === 'tokenId__') return;
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
            if (type === 'Wolf') return `${wolf.name}(${getWolfAttr('alpha', wolf)})`;
            return `${wolf.name}`;
          });
        embed.setDescription(desc.join('\r\n') + '\r\n' + tokens.join('\r'));
        return { msg: { content: `TO: ${showAddress(tx.to!, false)}`, embeds: [embed], components: [row] }, tokenIds };
      };
      const send = getMsg();
      const needAwait = send.tokenIds.filter((t) => !TokenInfoCache[t]);
      ch.send(send.msg).then(async (msg) => {
        if (needAwait.length === 0) return;
        const editMsg = async () => {
          const ress = await getAniJSON(`https://app.wolftown.world/animals?ids=${encodeURIComponent(JSON.stringify(needAwait))}`);
          needAwait.forEach((id) => {
            TokenInfoCache[id] = ress[id];
          });
          msg.edit(getMsg().msg);
        };
        let times = 0;
        while (times < 10) {
          try {
            await editMsg();
            times = 100;
          } catch (e) {
            await sleep(5000);
            times++;
          }
        }
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
const getAniJSON = async (uri: string): Promise<Record<string, Wolf>> => {
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

const parseMsg = (msg: string) => {
  msg = msg || '';
  const args = msg.split(',');
  const map: Record<string, string> = {};
  args.forEach((str) => {
    const cmd = str.split(':');
    if (cmd.length < 2) return;
    map[cmd[0]] = cmd[1];
  });
  return map;
};

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
        if (adds.length > 100) return;
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
          let name = 'Unknow';
          if (res) {
            name = res.name;
          }
          if (tx.to === Rescue.address) {
            name = 'Rescue';
          }
          const message = [
            {
              name: name,
              message: [
                { type: 'from', content: tx.from },
                { type: 'to', content: tx.to! },
              ],
            },
          ];
          const mainEvt = message[0].name;
          let MINT: typeof message[0] | null = null;
          if (mainEvt === 'mintMany') {
            MINT = { name: 'MINT', message: [] };
            message.push(MINT);
          }
          const parseLog = rtx.logs.map((log) => {
            let parse: ReturnType<typeof Wolf.interface.parseLog>;
            if (log.address === Wolf.address) {
              parse = Wolf.interface.parseLog(log);
            } else if (log.address === Barn.address) {
              parse = Barn.interface.parseLog(log);
            } else {
              return null;
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
            return parse;
          });

          if (MINT) {
            const fromZero = parseLog.filter((i) => i && i.name === 'Transfer' && i.args.from === ethers.constants.AddressZero);
            const loseNum = parseLog.filter((i) => i && i.name === 'TokenStolen');
            MINT.message.push({ type: '\r\nmint', content: fromZero.length + '' });
            MINT.message.push({ type: '\r\nlose', content: loseNum.length + '' });
            parseLog.forEach((i) => {
              if (!i) return;
              if (!MINT) return;
              if (i.args) {
                if (i.args.tokenId) MINT.message.push({ type: 'tokenId__', content: i.args.tokenId.toString() });
                if (i.args._tokenId) MINT.message.push({ type: 'tokenId__', content: i.args._tokenId.toString() });
              }
              if (i.name === 'TokenStolen') {
                MINT.message.push({ type: '\r\nSTOLEN', content: `${showAddress(i.args._address)} #${i.args._tokenId.toString()}` });
              }
            });
          }

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

  await sleep(10000);
  while (true) {
    console.log('lastBlock', db.lastBlock);
    await query();
    await sleep(3000);
  }
})();
function sleep(t = 100) {
  return new Promise((resolve) => setTimeout(resolve, t));
}
