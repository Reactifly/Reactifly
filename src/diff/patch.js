import { action } from './commit';
import * as vElem from '../vdom/utils';
import * as thunk from '../vdom/thunk';
import _ from '../utils/index';

//shouldComponentUpdate(nextProps, nextState)

/**
 * Patch previous/next render Vnodes (Recursive).
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
export function patch(left, right, actions)
{
    actions = _.is_undefined(actions) ? [] : actions;

    // Same nothing to do
    if (left === right)
    {
        // nothing to do
    }
    else if (left.type !== right.type)
    {
        replaceNode(left, right, actions);
    }
    else if (vElem.isNative(right))
    {
        patchNative(left, right, actions);
    }
    else if (vElem.isText(right))
    {
        patchText(left, right, actions);
    }
    else if (vElem.isThunk(right))
    {
        patchThunk(left, right, actions);
    }
    else if (vElem.isFragment(right))
    {
        patchFragment(left, right, actions);
    }
    else if (vElem.isEmpty(right))
    {
        replaceNode(left, right, actions);
    }
}

/**
 * Patch text Vnode.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchText(left, right, actions)
{
    if (right.nodeValue !== left.nodeValue)
    {
        let text = right.nodeValue.slice();

        actions.push(action('replaceText', [left, text]));
    }
}

/**
 * Replace Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function replaceNode(left, right, actions)
{
    if (vElem.isThunk(right))
    {
        if (vElem.isThunkInstantiated(right))
        {
            throw new Error('Thunk should not be instantiated.');
        }
        else
        {
            let component = thunk.thunkInstantiate(right);

            vElem.pointVnodeThunk(vnode, component);
        }
    }

    actions.push(action('replaceNode', [left, right]));
}

/**
 * Patch native Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchNative(left, right, actions)
{
    if (left.tagName !== right.tagName)
    {
        actions.push(action('replaceNode', [left, right]));
    }
    else
    {
        diffAttributes(left, right, actions);

        patchChildren(left, right, actions);
    }
}

/**
 * Patch thunk Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchThunk(left, right, actions)
{
    // Same component 
    if (vElem.isSameThunk(left, right))
    {
        patchThunkProps(left, right.props);

        diffThunk(left, right, actions);
    }
    // Different components
    else
    {
        let component = thunk.thunkInstantiate(right);

        vElem.pointVnodeThunk(right, component);

        actions.push(action('replaceNode', [left, right]));
    }
}

/**
 * Patch thunk props.
 * 
 * @param {object}  vnode
 * @param {object}  newProps
 */
function patchThunkProps(vnode, newProps)
{
    let component = vElem.nodeComponent(vnode);

    component.__internals.prevProps = _.cloneDeep(vnode.props);

    component.props = newProps;

    vnode.props = newProps;
}

/**
 * Diff thunk Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffThunk(left, right, actions)
{
    let component = vElem.nodeComponent(left);
    let rightchild = thunk.thunkRender(component);
    right.children = [rightchild];

    patchChildren(left, right, actions);
}

/**
 * Patch fragment Vnodes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchFragment(left, right, actions)
{
    patchChildren(left, right, actions);
}

/**
 * Patch Vnode children.
 * 
 * This is a less expensive pre-patch before diffing is needed if possible
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function patchChildren(left, right, actions)
{
    let lChildren = left.children;
    let rChildren = right.children;

    // Quick check
    if (vElem.noChildren(left) && vElem.noChildren(right))
    {
        return;
    }

    // We're only adding new children
    if (vElem.noChildren(left))
    {
        // Clear the children now
        left.children = [];

        // Only need to add a single child
        if (vElem.singleChild(right))
        {
            actions.push(action('appendChild', [left, rChildren[0]]));
        }

        // We're adding multiple new children
        else if (!vElem.noChildren(right))
        {
            _.foreach(rChildren, function(i, child)
            {
                actions.push(action('appendChild', [left, child]));
            });
        }
    }
    // There's only a single child in previous tree
    else if (vElem.singleChild(left))
    {
        // Both have a single node
        if (vElem.singleChild(right))
        {
            // left and right could be the same / different type, so we need to patch them
            patch(lChildren[0], rChildren[0], actions);
        }
        // We're only removing the left node, nothing to insert
        else if (vElem.noChildren(right))
        {
            // Replace empty with empty
            actions.push(action('replaceNode', [lChildren[0], rChildren[0]]));
        }
        // There's a single child getting replaced with multiple
        else
        {
            // Keys and positions haven't changed
            if (lChildren[0].key === rChildren[0].key)
            {
                patch(lChildren[0], rChildren[0], actions);

                _.foreach(rChildren, function(i, child)
                {
                    if (i > 0)
                    {
                        actions.push(action('appendChild', [left, child]));
                    }
                });
            }
            else
            {
                patchSingleToMultiChildren(left, right, lChildren[0], rChildren, actions);
            }
        }
    }
    // Previous tree has multiple children
    else
    {
        // Removing all children except one
        if (vElem.singleChild(right))
        {
            let matchedKey = false;

            _.foreach(lChildren, function(i, lChild)
            {
                if (lChild.key === rChildren[0].key)
                {
                    patch(lChild, rChildren[0], actions);

                    matchedKey = true;
                }
                else
                {
                    actions.push(action('removeChild', [left, lChild]));
                }
            });

            if (!matchedKey)
            {
                actions.push(action('appendChild', [left, rChildren[0]]));
            }
        }
        // We're only removing children
        else if (vElem.noChildren(right))
        {
            // When there are no child nodes in the new children
            _.foreach(left.children, function(i, child)
            {
                actions.push(action('removeChild', [left, child]));
            });

            // Append empty child
            actions.push(action('appendChild', [left, right.children[0]]));

        }
        // Both have multiple children, patch the difference
        else
        {
            diffChildren(left, right, actions);
        }
    }
}

/**
 * Patch single to multiple children
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {object}  lChild
 * @param {array}   rChildren
 * @param {array}   actions
 */
function patchSingleToMultiChildren(left, right, lChild, rChildren, actions)
{
    // We need to compare keys and check if one
    let lKey = lChild.key;
    let rChild = null;
    let newIndex = 0;

    // Append remaining children
    _.foreach(rChildren, function(i, child)
    {
        // If a key was matched but the child has moved index we need to move
        // and patch after appending all the new children
        if (child.key === lKey)
        {
            // If the child has moved index, we should move and patch it after
            if (i !== 0)
            {
                rChild = child;
                newIndex = i;
            }
            // Otherwise we just patch it now
            else
            {
                patch(lChild, child, actions);
            }
        }
        else
        {
            actions.push(action('appendChild', [left, child]));
        }
    });

    // The old key doesn't exist
    if (rChild)
    {
        actions.push(action('moveToIndex', [left, lChild, newIndex]));

        patch(lChild, rChild, actions);
    }
}

/**
 * Diff children.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffChildren(left, right, actions)
{
    let lGroup = groupByKey(left.children);
    let rGroup = groupByKey(right.children);
    let actionsStartIndex = actions.length > 0 ? actions.length : 0;
    let subActions = [];
    let inserted = 0;

    // Note we should still patch indivdual children etc.. but check keys

    // Special case if keys are exactly the same we can just patch each child
    let lKeys = Object.keys(lGroup);
    let rKeys = Object.keys(rGroup);

    if (_.is_equal(lKeys, rKeys))
    {
        _.foreach(right.children, function(i, rChild)
        {
            patch(left.children[i], rChild, actions);
        });

        return;
    }

    // Loop right children
    // Note insertAtIndex & removeChild to be executed before moveToIndex
    // otherwise moveToIndex will be incorrect

    // Also when moving multiple indexes, if a move has moves that run after it
    // that are being moved from before it to after it, that index will be incorrect
    // as the prior nodes have not been moved yet
    _.foreach(rGroup, function(_key, entry)
    {
        let rIndex = entry.index;
        let rChild = entry.child;
        let lEntry = lGroup[_key];

        // New node either by key or > index
        if (_.is_undefined(lEntry))
        {
            let _insert = rIndex >= lKeys.length ? action('appendChild', [left, rChild]) : action('insertAtIndex', [left, rChild, rIndex]);

            if (!inserted)
            {
                subActions.unshift(_insert);
            }
            else
            {
                subActions.splice(inserted, 0, _insert);
            }

            inserted++;
        }
        // Same key, check index
        else
        {
            delete lGroup[_key];

            let lChild = lEntry.child;

            // Different indexes
            // move then patch
            if (lEntry.index !== rIndex)
            {
                subActions.push(action('moveToIndex', [left, lChild, rIndex]));

                patch(lChild, rChild, actions);
            }
            // Unmoved / patch
            else
            {
                patch(lChild, rChild, actions);
            }
        }
    });

    // We need to remove children last so moving to index works
    if (!_.is_empty(lGroup))
    {
        _.foreach(lGroup, function(i, entry)
        {
            subActions.unshift(action('removeChild', [left, entry.child]));
        });
    }

    if (!_.is_empty(subActions))
    {
        _.foreach(subActions, function(i, action)
        {
            actions.splice(actionsStartIndex, 0, action);

            actionsStartIndex++;
        });
    }
}

// We need to key thunks by name / count here
// so they get patched rather than remounted

function groupByKey(children)
{
    let ret = {};
    let thunks = {};

    _.foreach(children, function(i, child)
    {
        let { key } = child;

        // This stop thunks from reinstating when they don't need to
        if (vElem.isThunk(child) && !key)
        {
            let name = vElem.thunkName(child);

            if (!_.is_undefined(thunks[name]))
            {
                key = name + '_' + (thunks[name] + 1);

                thunks[name]++;
            }
            else
            {
                key = name;

                thunks[name] = 1;
            }
        }
        else
        {
            key = !key ? ('|' + i) : key;
        }

        ret[key] = {
            index: i,
            child,
        };
    });

    return ret;
}

/**
 * Diff native attributes.
 * 
 * @param {object}  left
 * @param {object}  right
 * @param {array}   actions
 */
function diffAttributes(left, right, actions)
{
    let pAttrs = left.attributes;
    let nAttrs = right.attributes;

    // No changes
    if (_.is_empty(pAttrs) && _.is_empty(nAttrs))
    {
        return;
    }

    _.foreach(nAttrs, function(prop, value)
    {
        if (!_.is_equal(value, pAttrs[prop]))
        {
            actions.push(action('setAttribute', [left, prop, value, pAttrs[prop]]));
        }
    });

    _.foreach(pAttrs, function(prop, value)
    {
        if (!(prop in nAttrs))
        {
            actions.push(action('removeAttribute', [left, prop, pAttrs[prop]]));
        }
    });

    // Patch in new attributes
    vElem.nodeAttributes(left, nAttrs);
}