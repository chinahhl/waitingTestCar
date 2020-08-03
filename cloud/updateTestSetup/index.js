// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database().collection("UserInfo");// 选择 UserInfo 表
const LineUp_db = cloud.database().collection("AllUserLineUp");// 选择用户排队存放表
// 云函数入口函数
exports.main = async (event, context) => {
  let start_or_stop = event.start_or_stop; // 是否被暂停练车 0 否 1是
  let tb_id = event.tb_id;// 需要修改的用户表_id名字
  if (start_or_stop == 0) {
   return await db.doc(tb_id).update({ data: { stopTestcar: "1" } }) // 暂停用户练车
  } else {
   return await db.doc(tb_id).update({ data: { stopTestcar: "0" } }) // 允许用户练车
  }

  return {
    event,
    // openid: wxContext.OPENID,
    // appid: wxContext.APPID,
    // unionid: wxContext.UNIONID,
  }
}