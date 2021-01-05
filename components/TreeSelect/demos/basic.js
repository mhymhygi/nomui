define([], function () {
  return {
    title: '基础用法',
    file: 'basic',
    demo: function () {
      return {
        children: [
          {
            component: 'Panel',
            header: {
              caption: {
                title: '默认用法',
              },
            },
            body: {
              children: {
                component: 'TreeSelect',
              },
            },
          },
        ],
      }
    },
  }
})
