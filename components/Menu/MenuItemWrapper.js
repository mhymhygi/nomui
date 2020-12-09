import Component from '../Component/index'
import MenuItem from './MenuItem'
import MenuSub from './MenuSub'

class MenuItemWrapper extends Component {
    constructor(props, ...mixins) {
        const defaults = {
            tag: 'li',
            item: {
                component: MenuItem
            }
        }

        super(Component.extendProps(defaults, props), ...mixins)
    }

    _create() {
        this.isLeaf = false
        this.level = 0
        this.parentWrapper = null

        if (this.parent instanceof Component.components['Menu']) {
            this.menu = this.parent
        }
        else if (this.parent instanceof Component.components['MenuSub']) {
            this.menu = this.parent.menu
            this.parentWrapper = this.parent.wrapper
        }

        if (this.parentWrapper) {
            this.level = this.parentWrapper.level + 1
        }

        this.isLeaf = !Array.isArray(this.props.item.items) || this.props.item.items.length < 1
    }

    _config() {
        var that = this
        var menu = this.menu, menuProps = menu.props
        var expanded = menuProps.type === 'horizontal' || menuProps.itemExpandable.initExpandLevel >= this.level

        this.setProps({
            item: { name: 'item' },
            submenu: menuProps.submenu
        })

        this.setProps({
            submenu: {
                component: MenuSub,
                name: 'submenu',
                items: this.props.item.items,
                hidden: !expanded
            }
        })

        if (menuProps.type === 'horizontal' && !this.isLeaf) {
            var reference = document.body
            if (this.level > 0) {
                reference = this
            }
            var align = 'bottom left'
            if (this.level > 0) {
                align = 'right top'
            }

            this.setProps({
                submenu: {
                    wrapper: that
                }
            })

            this.setProps({
                item: {
                    popup: {
                        triggerType: 'hover',
                        align: align,
                        reference: reference,
                        children: this.props.submenu,
                    }
                }
            })
        }

        this.setProps({
            children: [
                this.props.item,
                (!this.isLeaf && menuProps.type === 'vertical') && this.props.submenu
            ]
        })
    }
}

Component.register(MenuItemWrapper)

export default MenuItemWrapper