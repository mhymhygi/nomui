import Component from '../Component/index'
import ListItemWrapper from './ListItemWrapper'

class ListContent extends Component {
    constructor(props, ...mixins) {
        const defaults = {
            tag: 'ul',
        }

        super(Component.extendProps(defaults, props), ...mixins)
    }

    _created() {
        this.list = this.parent
        this.list.wrapper = this
    }

    _config() {
        const { items, wrappers, wrapperDefaults } = this.list.props
        const children = []
        if (Array.isArray(wrappers) && wrappers.length > 0) {
            for (let i = 0; i < wrappers.length; i++) {
                let wrapper = wrappers[i]
                wrapper = Component.extendProps(
                    {},
                    { component: ListItemWrapper },
                    wrapperDefaults,
                    wrapper,
                )
                children.push(wrapper)
            }
        } else if (Array.isArray(items) && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
                children.push({ component: ListItemWrapper, item: items[i] })
            }
        }

        this.setProps({
            children: children,
        })
    }
}

Component.register(ListContent)

export default ListContent
