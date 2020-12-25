import Component from '../Component/index'

class Badge extends Component {
    constructor(props, ...mixins) {
        const defaults = {
            tag: 'span',
            type:'square',
            text: null,
            icon: null,
            number:null,
        }

        super(Component.extendProps(defaults, props), ...mixins)
    }

    _config() {
        this._propStyleClasses = ['size']
        let { icon, text, type, number } = this.props

        if (icon) {
            this.setProps({
                classes: {
                    'p-with-icon': true
                }
            })
        }

        if (type === 'round') {
            this.setProps({
                classes:{
                    'u-shape-round':true,
                }
            })
        }

        else if (type === 'dot') {
            if ( number > 0) {
                this.setProps({
                    classes:{
                        'p-with-number':true
                    }
                })
            }
        }

 
        
        this.setProps({
            children: [
                Component.normalizeIconProps(icon),
                text && { tag: 'span', children: text },
                number && {tag:'span', children:number}
            ]
        })


    }

    _disable() {
        this.element.setAttribute('disabled', 'disabled')
    }
}



Component.register(Badge)

export default Badge