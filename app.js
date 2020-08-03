const ResuleUserLocaltionInfo = require("./api/getUserLocaltion.js");// 获取用户位置信息
var Signin = "",// 是否可签到
InnerAudioContext = {}; // 是否关闭音效
App({
  onLaunch: function(){
    wx.cloud.init({
      env: 'online-pzcut'
    })
  },
  publicPlayMusic: function(OneMusic,Twotext){ // StopMusic 默认是假
    var _this = this;
    wx.downloadFile({
      url: 'https://ss0.baidu.com/6KAZsjip0QIZ8tyhnq/text2audio?tex='+ Twotext +'&cuid=dict&lan=zh&ctp=1&pdt=30&vol=100&spd=4',
      header:{ 
        'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
        'Sec-Fetch-Dest': 'video'
      },
      success: async res=>{
        console.log("音频文件获取成功",res)
        if(res.statusCode == 200){
          // res.tempFilePath
          _this.globalData.InnerAudioContext = await this.onstartaMuisc(OneMusic, res.tempFilePath);
          console.log(_this.globalData.InnerAudioContext)
        }
      },
      fail: err=>{
        console.log("播放文字获取失败",err)
      }
    })
  },
   // 开始播放音乐
  onstartaMuisc: async function(OneMusicSrc, TwoMusicSrc){
    var This = this;
    var innerAudioContext = wx.createInnerAudioContext(); // 构建实例
    innerAudioContext.src = OneMusicSrc;

    innerAudioContext.onCanplay(function () { // 音乐是否可以播放
      innerAudioContext.play();
    })
    innerAudioContext.onEnded(function () {
      innerAudioContext.destroy();
      innerAudioContext = wx.createInnerAudioContext(); // 构建实例
      innerAudioContext.src = TwoMusicSrc;
      innerAudioContext.onCanplay(function () {
        innerAudioContext.play();
        innerAudioContext.onEnded(function () {
          innerAudioContext.destroy()
        })
      })
    })
    // var Times = setInterval(function(){
    //   if(This.globalData.StopMusic != false){
    //     innerAudioContext.stop(); // 关闭音乐
    //     clearInterval(Times);
    //   }
    //   console.log(This.globalData.StopMusic)
    // },100)
    return innerAudioContext;
  },
  globalData: {
    ResuleUserLocaltionInfo,
    Signin,
    InnerAudioContext
  }
})
