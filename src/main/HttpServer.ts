import {sendIPCRecallQQMsg, sendIPCSendQQMsg} from "./IPCSend";

const express = require("express");
import {PostDataSendMsg} from "../common/types";
import {friends, groups} from "./data";

function handlePost(jsonData: any) {
    let resData = {
        status: 0,
        retcode: 0,
        data: {},
        message: ''
    }
    if (jsonData.action == "send_private_msg" || jsonData.action == "send_group_msg") {
        sendIPCSendQQMsg(jsonData);
    } else if (jsonData.action == "get_group_list") {
        resData["data"] = groups.map(group => {
            return {
                group_id: group.uid,
                group_name: group.name,
                group_members: group.members.map(member => {
                    return {
                        user_id: member.uin,
                        user_name: member.cardName || member.nick,
                        user_display_name: member.cardName || member.nick
                    }
                })
            }
        })
    } else if (jsonData.action == "get_group_member_list") {
        let group = groups.find(group => group.uid == jsonData.params.group_id)
        if (group) {
            resData["data"] = group?.members?.map(member => {
                let role = "member"
                switch (member.role) {
                    case 4: {
                        role = "owner"
                        break;
                    }
                    case 3: {
                        role = "admin"
                        break
                    }
                    case 2: {
                        role = "member"
                        break
                    }

                }
                return {
                    user_id: member.uin,
                    user_name: member.nick,
                    user_display_name: member.cardName || member.nick,
                    nickname: member.nick,
                    card: member.cardName,
                    role
                }

            }) || []
        } else {
            resData["data"] = []
        }
    } else if (jsonData.action == "get_friend_list") {
        resData["data"] = friends.map(friend => {
            return {
                user_id: friend.uin,
                user_name: friend.nickName,
            }
        })
    } else if (jsonData.action == "delete_msg") {
        sendIPCRecallQQMsg(jsonData.message_id)
    }
    return resData
}


export function startExpress(port: number) {
    const app = express();

    // 中间件，用于解析POST请求的请求体
    app.use(express.urlencoded({extended: true}));
    app.use(express.json());

    app.get('/', (req: any, res: any) => {
        res.send('llonebot已启动');
    })


    // 处理POST请求的路由
    app.post('/', (req: any, res: any) => {
        let jsonData: PostDataSendMsg = req.body;
        let resData = handlePost(jsonData)
        res.send(resData)
    });
    app.post('/send_private_msg', (req: any, res: any) => {
        let jsonData: PostDataSendMsg = req.body;
        jsonData.action = "send_private_msg"
        let resData = handlePost(jsonData)
        res.send(resData)
    })
    app.post('/send_group_msg', (req: any, res: any) => {
        let jsonData: PostDataSendMsg = req.body;
        jsonData.action = "send_group_msg"
        let resData = handlePost(jsonData)
        res.send(resData)
    })
    app.post('/send_msg', (req: any, res: any) => {
        let jsonData: PostDataSendMsg = req.body;
        if (jsonData.message_type == "private") {
            jsonData.action = "send_private_msg"
        } else if (jsonData.message_type == "group") {
            jsonData.action = "send_group_msg"
        } else {
            if (jsonData.params.group_id) {
                jsonData.action = "send_group_msg"
            } else {
                jsonData.action = "send_private_msg"
            }
        }
        let resData = handlePost(jsonData)
        res.send(resData)
    })
    app.post('/delete_msg', (req: any, res: any) => {
        let jsonData: PostDataSendMsg = req.body;
        jsonData.action = "delete_msg"
        let resData = handlePost(jsonData)
        res.send(resData)
    })
    app.listen(port, "0.0.0.0", () => {
        console.log(`服务器已启动，监听端口 ${port}`);
    });
}