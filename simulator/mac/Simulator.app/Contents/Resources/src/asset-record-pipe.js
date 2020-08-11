/****************************************************************************
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

//录制时间间隔
let RECORD_DELTA_TIME = 0.1;

let BEGIN_ID = 0;
let S_INTERVAL_ID = 0;

let recordList = [];
let screenShot = [];
let ID = 'AssetRecordPipe';

let _genItemInfo = function (item) {
    return {
        uuid: item.uuid || null,
        url: item.url,
        id: item.id,
        rawUrl: item.rawUrl
    }
};

let _genRecordInfo = function (time) {
    return {
        id: ++BEGIN_ID,
        ts: time,
        items: [],
        screenshot: ""
    }
};

let AssetRecordPipe = function () {
    this.id = ID;
    this.async = false;
    this.pipeline = null;

    recordList.push(_genRecordInfo(new Date().getTime()));
    this.screenShot();
};

AssetRecordPipe.ID = ID;

AssetRecordPipe.prototype.handle = function (item) {
    this.recordFrame(item);
    return null;
};

AssetRecordPipe.prototype.screenShot = function () {
    S_INTERVAL_ID = setInterval(function () {
        let now = new Date().getTime();
        let recordInfo = _genRecordInfo(now);
        recordList.push(recordInfo);

        let size = cc.winSize;
        let current_scene = cc.director.getScene();
        if (current_scene) {
            let render = new cc.RenderTexture();
            render.initWithSize(size.width, size.height);

            cc.Camera.main.targetTexture = render;
            cc.Camera.main.render();
            cc.Camera.main.targetTexture = null;
            let name = `${now}.jpg`;
            recordInfo.screenshot = name;

            let data = render.readPixels();
            let width = render.width;
            let height = render.height;
            jsb.saveImageData(data, width, height, `${CC_SIMULATOR_RECORD_PATH}/${name}`);
        }

        jsb.fileUtils.writeStringToFile(JSON.stringify(recordList), `${CC_SIMULATOR_RECORD_PATH}/timeline.json`);
    }, RECORD_DELTA_TIME * 1000);
};

AssetRecordPipe.prototype.recordFrame = function (item) {
    let last_item = recordList[recordList.length - 1];
    last_item.items.push(_genItemInfo(item));
};

if (CC_SIMULATOR_RECORD_MODE) {
    var recordPipe = new AssetRecordPipe();
    cc.loader.appendPipe(recordPipe);
    cc.loader.recordPipe = recordPipe;
}