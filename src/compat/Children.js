/**
 * Flatten and loop through the children of a virtual node
 * @param {import('../index').ComponentChildren} children The unflattened
 * children of a virtual node
 * @returns {import('../internal').VNode[]}
 */
function toChildArray(children, out)
{
    out = out || [];

    if (children == null || typeof children == 'boolean')
    {}
    else if (Array.isArray(children))
    {
        children.some(child =>
        {
            toChildArray(child, out);
        });
    }
    else
    {
        out.push(children);
    }
    return out;
}

const mapFn = (children, fn) =>
{
    if (children == null) return null;
    return toChildArray(toChildArray(children).map(fn));
};

// This API is completely unnecessary for Preact, so it's basically passthrough.
export const Children = {
    map: mapFn,
    forEach: mapFn,
    count(children)
    {
        return children ? toChildArray(children).length : 0;
    },
    only(children)
    {
        const normalized = toChildArray(children);

        if (normalized.length !== 1)
        {
            throw 'Children.only';
        }

        return normalized[0];
    },
    toArray: toChildArray
};