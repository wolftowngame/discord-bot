"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
exports.__esModule = true;
var fs = require('fs');
var BOT_TOKEN = fs.existsSync('.discord') ? fs.readFileSync('.discord').toString().trim() : '';
var discord_js_1 = require("discord.js");
var axios_1 = require("axios");
var ethers_1 = require("ethers");
var StaticWeb3Read = new ethers_1.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
var db = {};
var AdminUser = ['885409915055775754'];
try {
    db = require('./db.json');
}
catch (e) {
    //
}
finally {
    db.lastBlock = db.lastBlock || 0;
    db.WatchList = db.WatchList || {};
}
var dbSave = function () {
    fs.writeFile('./db.json', JSON.stringify(db), function () { });
};
var Wolf = new ethers_1.Contract('0x14f112d437271e01664bb3680BcbAe2f6A3Fb5fB', require('./Wolf.json'), StaticWeb3Read);
var Barn = new ethers_1.Contract('0x10A6DC9fb8F8794d1Dc7D16B035c40923B148AA4', require('./Barn.json'), StaticWeb3Read);
var Rescue = new ethers_1.Contract('0xCe487D0Ab195D28FE18D5279B042498f84eb051F', require('./Barn.json'), StaticWeb3Read);
var Wool = new ethers_1.Contract('0xAA15535fd352F60B937B4e59D8a2D52110A419dD', require('./ERC20.json'), StaticWeb3Read);
var Milk = new ethers_1.Contract('0x60Ca032Ba8057FedB98F6A5D9ba0242AD2182177', require('./ERC20.json'), StaticWeb3Read);
var AddressTranslate = (_a = {},
    _a[Wolf.address] = 'WolfTown',
    _a[Barn.address] = 'Barn',
    _a[Rescue.address] = 'Rescue',
    _a);
var client = new discord_js_1.Client({
    intents: [discord_js_1.Intents.FLAGS.GUILD_MESSAGES, discord_js_1.Intents.FLAGS.DIRECT_MESSAGES]
});
var WatchList = (db.WatchList = db.WatchList || {});
var cmds = ['MINT', 'Unknown', 'Barn-UNSTAKE', 'STAKE-MILK', 'STAKE-WOOL', 'STAKE-WOLF', 'STOLEN', 'TokenStolen'];
// Wolf.interface.fragments.forEach((it) => {
//   if (cmds.includes(it.name)) return;
//   cmds.push(it.name);
// });
// Barn.interface.fragments.forEach((it) => {
//   if (cmds.includes(it.name)) return;
//   cmds.push('Barn-' + it.name);
// });
cmds = cmds.filter(function (i) { return i; });
var testCid = '947753505844760607';
WatchList[testCid] = cmds;
client.once('ready', function () {
    if (!client.user)
        return;
    console.log("Logged in as " + client.user.tag + "!");
});
client.on('error', function (msg) { return console.log('error:', msg); });
var MessageWatch = function (msg) { return __awaiter(void 0, void 0, void 0, function () {
    var bot, from, botWasMentioned, matchd, want, event_1, to, event_2, to, cid;
    return __generator(this, function (_a) {
        console.log('messageCreate', msg.channelId);
        bot = client.user;
        from = msg.author;
        if (from.id === bot.id)
            return [2 /*return*/];
        botWasMentioned = msg.mentions.users.find(function (mentionedUser) { return mentionedUser.id === bot.id; });
        if (botWasMentioned && AdminUser.includes(from.id)) {
            WatchList[msg.channelId] = WatchList[msg.channelId] || [];
            matchd = msg.content.trim().match(/cmd\:(.*)$/);
            if (!matchd)
                return [2 /*return*/];
            want = parseMsg(matchd[1]);
            if (want.add) {
                event_1 = want.add;
                if (!cmds.includes(event_1))
                    return [2 /*return*/];
                to = msg.channelId || want.id;
                if (WatchList[to].includes(event_1)) {
                    msg.channel.send('Already registered');
                    return [2 /*return*/];
                }
                WatchList[to].push(event_1);
                msg.channel.send('Successful');
                dbSave();
                return [2 /*return*/];
            }
            if (want.del) {
                event_2 = want.del;
                if (!cmds.includes(event_2))
                    return [2 /*return*/];
                to = msg.channelId || want.id;
                if (WatchList[to].includes(event_2))
                    WatchList[to].splice(WatchList[to].indexOf(event_2), 1);
                msg.channel.send('Successful');
                dbSave();
                return [2 /*return*/];
            }
            if (want.pub) {
                cid = want.pub;
                client.channels.fetch(cid).then(function (ch) {
                    if (ch)
                        ch.send('Hello!');
                });
            }
            msg.channel.send(WatchList[msg.channelId].join(';'));
            return [2 /*return*/];
        }
        return [2 /*return*/];
    });
}); };
client.on('messageCreate', MessageWatch);
client.login(BOT_TOKEN);
var defaultDvt = {
    name: '',
    message: [{ type: '', content: '' }]
};
var ChannelCache = {};
var TokenInfoReqCache = {};
var TokenInfoCache = {};
var emitEvent = function (tx, evt) {
    if (evt === void 0) { evt = [defaultDvt]; }
    var _loop_1 = function (id) {
        var watchs = db.WatchList[id];
        if (watchs.length === 0)
            return "continue";
        var con = '';
        if (tx.to === Barn.address)
            con = 'Barn-';
        var evts = evt.filter(function (e) { return watchs.includes(con + e.name); });
        if (evts.length === 0)
            return "continue";
        if (!ChannelCache[id])
            ChannelCache[id] = client.channels.fetch(id);
        ChannelCache[id].then(function (ch) {
            var getMsg = function () {
                var _a;
                var tokenIds = [];
                var row = new discord_js_1.MessageActionRow();
                var embed = new discord_js_1.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle("IN: " + tx.blockNumber)
                    .setAuthor({ name: "FROM: " + showAddress(tx.from, false) })
                    .setURL("https://bscscan.com/tx/" + tx.hash)
                    // .addFields(
                    //   // { name: '\u200B', value: '\u200B' },
                    //   { name: 'Inline field title', value: 'Some value here', inline: true },
                    //   { name: 'Inline field title', value: 'Some value here', inline: true },
                    // )
                    // .addField('Inline field title', 'Some value here', true)
                    // .setImage('https://i.imgur.com/AfFp7pu.png')
                    .setTimestamp()
                    .setFooter({ text: 'Bug and suggestion, contact @imconfig', iconURL: 'https://avatars.githubusercontent.com/u/2430646?v=4' });
                var btns = (_a = {},
                    _a[ethers_1.ethers.constants.AddressZero] = true,
                    _a);
                btns[tx.from] = true;
                row.addComponents(new discord_js_1.MessageButton({ label: "from: " + showAddress(tx.from), style: 'LINK', url: "https://bscscan.com/address/" + tx.from }));
                btns[tx.to] = true;
                row.addComponents(new discord_js_1.MessageButton({ label: "to: " + showAddress(tx.to), style: 'LINK', url: "https://bscscan.com/address/" + tx.to }));
                var desc = [];
                evts.forEach(function (e) {
                    var contents = [];
                    e.message.forEach(function (s) {
                        if (['tokenId', 'tokenId__'].includes(s.type) && !tokenIds.includes(s.content)) {
                            tokenIds.push(s.content);
                        }
                        if (s.type === 'tokenId__')
                            return;
                        if (!btns[s.content] && Object.keys(btns).length < 6 && ethers_1.ethers.utils.isAddress(s.content)) {
                            btns[s.content] = true;
                            row.addComponents(new discord_js_1.MessageButton({ label: "" + showAddress(s.content), style: 'LINK', url: "https://bscscan.com/address/" + s.content }));
                        }
                        contents.push(s.type + ":" + showAddress(s.content));
                    });
                    // embed.addField(e.name, contents.join(' '), true);
                    desc.push("[" + e.name + "]:" + contents.join(' '));
                });
                var tokens = tokenIds
                    .filter(function (i) { return TokenInfoCache[i]; })
                    .map(function (id) {
                    var wolf = TokenInfoCache[id];
                    var type = getWolfAttr('type', wolf);
                    if (type === 'Wolf')
                        return wolf.name + "(" + getWolfAttr('alpha', wolf) + ")";
                    return "" + wolf.name;
                });
                embed.setDescription(desc.join('\r\n') + '\r\n' + tokens.join('\r'));
                return { msg: { content: "TO: " + showAddress(tx.to, false), embeds: [embed], components: [row] }, tokenIds: tokenIds };
            };
            var send = getMsg();
            var needAwait = send.tokenIds.filter(function (t) { return !TokenInfoCache[t]; });
            ch.send(send.msg).then(function (msg) { return __awaiter(void 0, void 0, void 0, function () {
                var editMsg, times, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (needAwait.length === 0)
                                return [2 /*return*/];
                            editMsg = function () { return __awaiter(void 0, void 0, void 0, function () {
                                var ress;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, getAniJSON("https://app.wolftown.world/animals?ids=" + encodeURIComponent(JSON.stringify(needAwait)))];
                                        case 1:
                                            ress = _a.sent();
                                            needAwait.forEach(function (id) {
                                                TokenInfoCache[id] = ress[id];
                                            });
                                            msg.edit(getMsg().msg);
                                            return [2 /*return*/];
                                    }
                                });
                            }); };
                            times = 0;
                            _a.label = 1;
                        case 1:
                            if (!(times < 10)) return [3 /*break*/, 7];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 6]);
                            return [4 /*yield*/, editMsg()];
                        case 3:
                            _a.sent();
                            times = 100;
                            return [3 /*break*/, 6];
                        case 4:
                            e_1 = _a.sent();
                            return [4 /*yield*/, sleep(5000)];
                        case 5:
                            _a.sent();
                            times++;
                            return [3 /*break*/, 6];
                        case 6: return [3 /*break*/, 1];
                        case 7: return [2 /*return*/];
                    }
                });
            }); });
        });
    };
    for (var id in db.WatchList) {
        _loop_1(id);
    }
};
var getWolfAttr = function (name, wolf) {
    var res = wolf.attributes.find(function (i) { return i.trait_type === name; });
    if (!res)
        return '';
    return res.value;
};
var getAniJSON = function (uri) { return __awaiter(void 0, void 0, void 0, function () {
    var res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, axios_1["default"].get(uri)];
            case 1:
                res = _a.sent();
                return [2 /*return*/, res.data];
        }
    });
}); };
function showAddress(address, s) {
    if (s === void 0) { s = true; }
    var res = AddressTranslate[address] || address;
    if (!s)
        return res;
    if (ethers_1.ethers.utils.isAddress(res))
        return AddressShortString(res);
    return res;
}
function AddressShortString(address) {
    return address.replace(/(0x[0-9a-zA-Z]{4})(.*?)([0-9a-zA-Z]{4})$/, '$1...$3');
}
var NumTrue = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
var parseMsg = function (msg) {
    msg = msg || '';
    var args = msg.split(',');
    var map = {};
    args.forEach(function (str) {
        var cmd = str.split(':');
        if (cmd.length < 2)
            return;
        map[cmd[0]] = cmd[1];
    });
    return map;
};
var txCache = {};
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var query;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                query = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var res, adds_2, txCacheMap_1, _loop_2, _i, adds_1, msg, e_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 6, 7, 8]);
                                return [4 /*yield*/, Wolf.queryFilter({}, (-30 * 60) / 3, 'latest')];
                            case 1:
                                res = _a.sent();
                                adds_2 = [];
                                txCacheMap_1 = {};
                                res.forEach(function (item) {
                                    if (item.blockNumber <= db.lastBlock)
                                        return;
                                    db.lastBlock = item.blockNumber;
                                    var key = item.transactionHash + item.logIndex;
                                    if (txCache[key])
                                        return;
                                    if (adds_2.length > 100)
                                        return;
                                    txCache[key] = true;
                                    if (item.event !== 'Transfer' && item.event !== 'TokenStolen')
                                        return;
                                    if (!txCacheMap_1[item.transactionHash]) {
                                        txCacheMap_1[item.transactionHash] = { tx: item.transactionHash, key: key };
                                        adds_2.push(txCacheMap_1[item.transactionHash]);
                                    }
                                    // const transferData = txCacheMap[item.transactionHash];
                                });
                                _loop_2 = function (msg) {
                                    var _b, tx, rtx, res_1, name_1, message_1, mainEvt, MINT_1, parseLog, fromZero, loseNum, e_3;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0:
                                                _c.trys.push([0, 2, , 3]);
                                                return [4 /*yield*/, Promise.all([StaticWeb3Read.getTransaction(msg.tx), StaticWeb3Read.getTransactionReceipt(msg.tx)])];
                                            case 1:
                                                _b = _c.sent(), tx = _b[0], rtx = _b[1];
                                                res_1 = void 0;
                                                if (tx.to === Wolf.address) {
                                                    res_1 = Wolf.interface.parseTransaction(tx);
                                                }
                                                else if (tx.to === Barn.address) {
                                                    res_1 = Barn.interface.parseTransaction(tx);
                                                }
                                                else {
                                                    res_1 = null;
                                                }
                                                name_1 = 'Unknow';
                                                if (res_1) {
                                                    name_1 = res_1.name;
                                                }
                                                if (tx.to === Rescue.address) {
                                                    name_1 = 'Rescue';
                                                }
                                                message_1 = [
                                                    {
                                                        name: name_1,
                                                        message: [
                                                            { type: 'from', content: tx.from },
                                                            { type: 'to', content: tx.to },
                                                        ]
                                                    },
                                                ];
                                                mainEvt = message_1[0].name;
                                                MINT_1 = null;
                                                if (mainEvt === 'mintMany') {
                                                    MINT_1 = { name: 'MINT', message: [] };
                                                    message_1.push(MINT_1);
                                                }
                                                parseLog = rtx.logs.map(function (log) {
                                                    var parse;
                                                    if (log.address === Wolf.address) {
                                                        parse = Wolf.interface.parseLog(log);
                                                    }
                                                    else if (log.address === Barn.address) {
                                                        parse = Barn.interface.parseLog(log);
                                                    }
                                                    else {
                                                        return null;
                                                    }
                                                    var evt = {
                                                        name: parse.name,
                                                        message: []
                                                    };
                                                    for (var i in parse.args) {
                                                        if (NumTrue[i])
                                                            continue;
                                                        var content = parse.args[i];
                                                        if (typeof content === 'string') {
                                                            evt.message.push({ type: i, content: content });
                                                        }
                                                        else if (content instanceof ethers_1.BigNumber) {
                                                            evt.message.push({ type: i, content: content.toString() });
                                                        }
                                                        else {
                                                            evt.message.push({ type: i, content: content.toString() });
                                                        }
                                                    }
                                                    message_1.push(evt);
                                                    return parse;
                                                });
                                                if (MINT_1) {
                                                    fromZero = parseLog.filter(function (i) { return i && i.name === 'Transfer' && i.args.from === ethers_1.ethers.constants.AddressZero; });
                                                    loseNum = parseLog.filter(function (i) { return i && i.name === 'TokenStolen'; });
                                                    MINT_1.message.push({ type: '\r\nmint', content: fromZero.length + '' });
                                                    MINT_1.message.push({ type: '\r\nlose', content: loseNum.length + '' });
                                                    parseLog.forEach(function (i) {
                                                        if (!i)
                                                            return;
                                                        if (!MINT_1)
                                                            return;
                                                        if (i.args) {
                                                            if (i.args.tokenId)
                                                                MINT_1.message.push({ type: 'tokenId__', content: i.args.tokenId.toString() });
                                                            if (i.args._tokenId)
                                                                MINT_1.message.push({ type: 'tokenId__', content: i.args._tokenId.toString() });
                                                        }
                                                        if (i.name === 'TokenStolen') {
                                                            MINT_1.message.push({ type: '\r\nSTOLEN', content: showAddress(i.args._address) + " #" + i.args._tokenId.toString() });
                                                        }
                                                    });
                                                }
                                                emitEvent(tx, message_1);
                                                return [3 /*break*/, 3];
                                            case 2:
                                                e_3 = _c.sent();
                                                console.error('send msg err', e_3);
                                                return [3 /*break*/, 3];
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                };
                                _i = 0, adds_1 = adds_2;
                                _a.label = 2;
                            case 2:
                                if (!(_i < adds_1.length)) return [3 /*break*/, 5];
                                msg = adds_1[_i];
                                return [5 /*yield**/, _loop_2(msg)];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4:
                                _i++;
                                return [3 /*break*/, 2];
                            case 5:
                                dbSave();
                                return [3 /*break*/, 8];
                            case 6:
                                e_2 = _a.sent();
                                console.log('e', e_2);
                                return [3 /*break*/, 8];
                            case 7: return [7 /*endfinally*/];
                            case 8: return [2 /*return*/];
                        }
                    });
                }); };
                return [4 /*yield*/, sleep(10000)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                if (!true) return [3 /*break*/, 5];
                console.log('lastBlock', db.lastBlock);
                return [4 /*yield*/, query()];
            case 3:
                _a.sent();
                return [4 /*yield*/, sleep(3000)];
            case 4:
                _a.sent();
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/];
        }
    });
}); })();
function sleep(t) {
    if (t === void 0) { t = 100; }
    return new Promise(function (resolve) { return setTimeout(resolve, t); });
}
