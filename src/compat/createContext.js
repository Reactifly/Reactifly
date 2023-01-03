import { thunkUpdate } from '../vdom/thunk';

let i = 0;

export function createContext(defaultValue, contextId)
{
    contextId = '__cC' + i++;

    const context = {
        _id: contextId,
        _defaultValue: defaultValue,

        /** @type
        {import('./internal').FunctionComponent} */
        Consumer(props, contextValue)
        {
            // return props.children(
            //  context[contextId] ? context[contextId].props.value : defaultValue
            // );
            return props.children(contextValue);
        },

        /** @type
        {import('./internal').FunctionComponent} */
        Provider(props)
        {
            if (!this.getChildContext)
            {
                let subs = [];
                let ctx = {};

                ctx[contextId] = this;

                this.getChildContext = () => ctx;

                this.shouldComponentUpdate = function(_props)
                {
                    if (this.props.value !== _props.value)
                    {
                        subs.some(thunkUpdate);
                    }
                };

                this.sub = c =>
                {
                    subs.push(c);

                    let old = c.componentWillUnmount;

                    c.componentWillUnmount = () =>
                    {
                        subs.splice(subs.indexOf(c), 1);

                        if (old)
                        {
                            old.call(c);
                        }
                    };
                };
            }

            return props.children;
        }
    };

    return (context.Provider._contextRef = context.Consumer.contextType = context);
}