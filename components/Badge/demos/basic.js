define([], function () {

    return {
        title: '基础用法',
        file: 'basic',
        demo: function () {
            return {
                children: [
                    {
                        component: 'Badge',
                        text: '默认',
                    },
                    {
                        component: 'Badge',
                        text: '带图标',
                        icon:'plus',
                        styles: {
                            color: 'primary'
                        }
                    },
                    {
                        component: 'Badge',
                        text: '带数字',
                        number:'5',
                        styles: {
                            color: 'primary'
                        }
                    },
                    {
                        component: 'Badge',
                        text: '圆形',
                        type:'round',
                    },
                    {
                        component: 'Button',
                        text: '带圆点',
                        badge:{
                            styles: {
                                color: 'primary'
                            }
                        }
                    },
                    {
                        component: 'Button',
                        text: '带数字',
                        badge:{
                            number:5,
                            styles: {
                                color: 'primary'
                            }
                        }
                    },
                ]
            }
        }
    }
})