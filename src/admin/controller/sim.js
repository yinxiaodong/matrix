'use strict';

import Base from './base.js';

export default class extends Base {

  async __before() {
    this.userInfo = await this.session('userInfo');
    if (this.userInfo) {
      this.assign('user', this.userInfo);
      return Promise.resolve();
    }
    this.redirect('/admin/user');
    return Promise.reject();
  }

  async indexAction() {
    let page = this.get('page') || 1;
    let num = this.get('num') || 10;
    let q = this.get('q');

    let condition = {
      state: ["<>", 2]
    };

    if (q) {
      condition.name = ['like', '%' + q + '%'];
    }

    let model = this.model('sim');
    let slides = await model.page(page, num)
      .field('sim.id, name, pinyin, unit, pint, sint, prc, sub')
      .order('id DESC')
      .where(condition)
      .countSelect();

    this.assign({
      slides: slides.data || [],
      pages: slides.totalPages,
      page: slides.currentPage
    });
    return this.display();
  }
//保存更新
  async saveAction() {
    let {sid, title, theme, slide_content} = this.post();

    //console.log(title, theme, slide_content); 
    let model = this.model("sim");
    let moment = require('moment');
    let datetime = moment().format('YYYY-MM-DD HH:mm:ss');

    let record = {
      title: title,
      theme: theme,
      content: slide_content,
      updateTime: datetime,
      userId: this.userInfo.id,
      createTime: datetime
    };
    //console.log(record);

    if (!sid) {
      sid = await model.add(record).catch(err => this.json({ err: err.message || 'error' }));

      if (sid) return this.json({ err: '', id: sid });
    } else {
      let affectedRows = await model
        .where({ id: sid })
        .update(record)
        .catch(err => this.json({ err: err.message || 'error' }));

      if (affectedRows) return this.json({ err: '', id: sid });
    }
  }
//禁用
  async deleteAction() {
    let {id} = this.get();
    let model = this.model("sim");

    if (id) {
      let affectedRows = await model
        .where({ id: ['in', id] })
        .update({ state: 2 });
    }

    return this.redirect('/admin/sim');
  }
//恢复
  async recoverAction() {
    let {id} = this.get();
    let model = this.model("sim");
    let moment = require('moment');
    let datetime = moment().format('YYYY-MM-DD HH:mm:ss');

    if (id) {
      let affectedRows = await model
        .where({ id: ['in', id] })
        .update({ state: 0, updateTime: datetime });
    }

    return this.redirect('/admin/sim');
  }
//保留
  async publishAction() {
    let {id} = this.get();
    let model = this.model("sim");
    let moment = require('moment');
    let datetime = moment().format('YYYY-MM-DD HH:mm:ss');

    if (id) {
      let data = await model.where({ id }).find();
      if (data) {
        //console.log(data);
        let affectedRows = await model
          .where({ id: ['in', id] })
          .update({ state: 0 | !data.state, updateTime: datetime });
      }
    }

    return this.redirect('/admin');
  }
//删除
  async destoryAction() {
    let {id} = this.get();
    let model = this.model("sim");

    if (id) {
      let affectedRows = await model
        .where({ id: ['in', id] })
        .delete();
    }

    return this.redirect('/admin/index/trash');
  }
//预览
  async previewAction() {
    let {id} = this.get();
    if (id) {
      let model = this.model("sim");
      let slide = await model.where({ id }).find();
      //console.log(slide);
      this.assign({ slide });
    }
    return this.display();
  }
}