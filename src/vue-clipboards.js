/**
 * @author: 卓文理
 * @email : 531840344@qq.com
 * @desc  : VueClipboard
 */

const Clipboard = require('clipboard');

if (!Clipboard) {
    throw new Error('[vue-clipboards] cannot locate Clipboard.');
}

function isDom (obj) {
    return typeof window.HTMLElement === 'object'
        ? obj instanceof window.HTMLElement
        : obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
}

export default function (Vue) {
    const clipboards = {};
    const def = 'DEFAULT_KEY';

    Vue.directive('clipboard', {
        bind (container, { value }, vnode) {
            const option = {};
            const key = (vnode.key || vnode.key === 0) ? vnode.key : def;
            let $parent = null;

            if (value && /(string|number)/.test(typeof value)) {
                option.text = () => value;
            }

            if (vnode.data.attrs && vnode.data.attrs.model) {
                $parent = isDom(vnode.data.attrs.model)
                        ? vnode.data.attrs.model
                        : document.querySelector(vnode.data.attrs.model);
            }

            // 修复按钮脱离文档流时，clipboard监听失败问题
            if (vnode.elm.offsetParent) {
                option.container = vnode.elm.offsetParent;
            } else if (isDom($parent)) {
                option.container = $parent;
            } else {
                option.container = container.parentElement;
            }

            clipboards[key] = new Clipboard(container, option);

            const { componentOptions, data } = vnode;
            const listeners = componentOptions ? componentOptions.listeners : null;
            const on = data ? data.on : null;
            const events = (listeners && listeners) || (on && on);

            if (events && typeof events === 'object' && Object.keys(events).length) {
                // fixed with Vue 2.2.x, event object `fn` rename to `fns`
                Object.keys(events).map(
                    cb => clipboards[key].on(cb, events[cb].fn || events[cb].fns)
                );
            }
        },
        unbind (vnode) {
            const key = (vnode.key || vnode.key === 0) ? vnode.key : def;

            if (clipboards[key] && clipboards[key].destroy) {
                clipboards[key].destroy();
                clipboards[key] = null;
            }
        },
        update (container, binding, vnode) {
            binding.def.unbind(vnode);
            binding.def.bind(container, binding, vnode);
        }
    });
}