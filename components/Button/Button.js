import Component from '../Component/index'

class Button extends Component {
  constructor(props, ...mixins) {
    const defaults = {
      tag: 'button',
      text: null,
      icon: null,
      rightIcon: null,
      hoverable: true,
    }

    super(Component.extendProps(defaults, props), ...mixins)
  }

  _config() {
    this._propStyleClasses = ['size']
    const { icon, text, rightIcon, href } = this.props

    if (icon || rightIcon) {
      this.setProps({
        classes: {
          'p-with-icon': true,
        },
      })

      if (!text) {
        this.setProps({
          classes: {
            'p-only-icon': true,
          },
        })
      }
    }

    this.setProps({
      children: [
        Component.normalizeIconProps(icon),
        text && { tag: 'span', children: text },
        Component.normalizeIconProps(rightIcon),
      ],
    })

    if (href) {
      this.setProps({
        tag: 'a',
        attrs: {
          href: href,
        },
      })
    }
  }

  _disable() {
    this.element.setAttribute('disabled', 'disabled')
  }
}

Component.register(Button)

export default Button
