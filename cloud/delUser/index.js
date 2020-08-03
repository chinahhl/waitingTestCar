// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const DB = cloud.database().collection("UserInfo");// 选择 UserInfo 表
// 云函数入口函数
exports.main = async (event) => {
  await DB.doc(event.tb_id).remove();
  return {
    event
  }
}