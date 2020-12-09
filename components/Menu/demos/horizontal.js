define([], function () {

    return {
        text: '水平菜单',
        demo: function () {
            return {
                children: [
                    {
                        component: 'Menu',
                        items: [
                            { text: '起步', id: 'css', url: '#!css!' },
                            {
                                text: '样式', id: 'css',
                                items:
                                    [
                                        { text: '起步', id: 'css', url: '#!css!' },
                                        {
                                            text: '样式', id: 'css', url: '#!css!',
                                            items:
                                                [
                                                    { text: '起步', id: 'css', url: '#!css!' },
                                                    { text: '样式', id: 'css', url: '#!css!' }
                                                ]
                                        }
                                    ]
                            },
                            { text: '组件', id: 'components', url: '#!components!' },
                            { text: '单页应用', id: 'javascript', url: '#!components!demo' }
                        ],
                        type: 'horizontal'
                    }
                ]
            };
        }
    };
});