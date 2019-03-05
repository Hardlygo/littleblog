/*
 * @Author: pengzy
 * @Date: 2018-07-05 11:58:26
 * @LastEditors: pengzy
 * @LastEditTime: 2018-07-19 15:01:20
 * @Description: 
 */
//时间格式化
var moment = require('moment')
    //根据objectID生成时间戳
var objectid2timestamp = require('objectid-to-timestamp')
    //内容转换为html中间件
var marked = require('marked')
    /**
     * @description 判断一个js对象是否为 undefined 或者{}
     * @param {*} Object
     */
var isEmptyObject = function(object) {
        let hasPro = true;
        if (typeof object == 'undefined') {
            return hasPro;
        }
        for (let pro in object) {
            if (object[pro]) {
                hasPro = false;
                break;
            }
        }
        return hasPro;
    }
    /**
     * @description 为数据库查询结果增加一个创建时间项
     * @param {*} items
     */
var addCreateAt = function(items) {

        if (Array.isArray(items)) {
            for (let item of items) {
                if (item._id) {
                    item['create_at'] = moment(objectid2timestamp(item._id)).format('YYYY-MM-DD HH:mm')
                }
            }
        } else {
            if (!isEmptyObject(items)) {
                if (items._id) {
                    items['create_at'] = moment(objectid2timestamp(items._id)).format('YYYY-MM-DD HH:mm')
                }
            }

        }
    }
    /**
     * @description post内容转为html
     * @param {*} items
     */
var content2html = function(items) {

    if (Array.isArray(items)) {
        for (let item of items) {
            if (item.content) {
                item['content'] = marked(item.content)
            }
        }
    } else {
        if (!isEmptyObject(items)) {
            if (items.content) {
                items['content'] = marked(items.content)
            }
        }

    }
}

var getResponse = function(statu, msg, data) {
    return {
        statu: statu,
        result: statu == 1 ? '成功' : '失败',
        detail: msg ? msg : '',
        data: data ? data : {}
    }
}




module.exports = {
    isEmptyObject,
    addCreateAt,
    content2html,
    getResponse
}