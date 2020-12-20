export default {
    _create: function () {
        this.field = this.parent.field
        this.field.control = this
        this.form = this.field.form
    },
    _config: function () {
        this.on('valueChange', function () {
            this.field.trigger('valueChange')
        })
    }
}