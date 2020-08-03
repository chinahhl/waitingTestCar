// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database().collection("StudentApplication");// 选择 UserInfo 表
// 云函数入口函数
exports.main = async (event) => {
  await db.add({ data: event.userobj }) // 将用户添加到申请表里 
  return {
    event
  }
}