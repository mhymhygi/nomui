define([], function () {

    return {
        text: '表单数据',
        demo: function () {
            return {
                children: {
                    component: 'Form',
                    value: {
                        name: 'Jerry'
                    },
                    fields: [
                        {
                            name: 'name',
                            label: '姓名',
                            control: {
                                component: 'Textbox',
                                required: true,
                                rules: [
                                    { type: 'identifier' },
                                    { type: 'minlength', value: 2 },
                                    { type: 'maxlength', value: 12 }
                                ]
                            }
                        },
                        {
                            name: 'age',
                            label: '年龄',
                            control: {
                                component: 'Numberbox',
                                required: true,
                                min: 0,
                                max: 100
                            }
                        },
                        {
                            name: 'email',
                            label: 'Email',
                            control: {
                                component: 'Textbox',
                                required: true,
                                rules: [
                                    { type: 'email', message: 'Email 格式不正确' }
                                ]
                            }
                        },
                        {
                            name: 'gender',
                            label: '性别',
                            control: {
                                component: 'RadioList',
                                options: [
                                    { text: '男', value: 0 },
                                    { text: '女', value: 1 }
                                ]
                            },
                            value: 0
                        },
                        {
                            name: 'hobbies',
                            label: '爱好',
                            control: {
                                component: 'CheckboxList',
                                options: [
                                    { text: '唱歌', value: 1 },
                                    { text: '跳舞', value: 2 },
                                    { text: '旅游', value: 3 }
                                ]
                            },
                            value: [1, 3]
                        }
                    ]
                }
            };
        }
    };
});