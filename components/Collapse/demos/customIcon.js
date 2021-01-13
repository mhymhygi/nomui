define([], function () {
  return {
    title: '自定义图标',
    file: 'customIcon',
    demo: function () {
      return {
        component: 'Panel',
        header: {
          caption: {
            title: '自定义图标',
          },
        },
        body: {
          children: {
            component: 'Collapse',
            bordered: true,
            iconOnly: true,
            icon: {
              default: 'plus',
              open: 'up',
            },
            items: [
              {
                key: 1,
                title: '为啥企鹅的脚不怕冻？',
                content:
                  '这项特殊技能也是企鹅保证孵化温度的一项。黑暗的冬季里，雄性帝企鹅会在两个月的时间内把一枚卵放在脚上进行孵化，而雌性帝企鹅则出海捕食。帝企鹅爸爸还会用一层温暖的育儿袋覆盖住这枚卵，确保它不受外部天气影响。',
              },
              {
                key: 2,
                title: '这是一个好问题',
                content:
                  '企鹅的腿部和足部已经进化出了尽可能减少热量流失的能力。企鹅在极寒天气中通过限制血流来维持热量，保证脚部不被冻僵。企鹅的腿部就像是一个热交换系统，连接脚部的血管非常窄，而且紧密的交织在一起，在输送至脚部时为血液降温，而从脚部回流至身体时又为血液进行加温。流至脚部的低温血液可以减少热量流失，同时回流的血液又能保证身体温暖舒适。',
              },
            ],
          },
        },
      }
    },
  }
})
