import { clearLog, getLog } from './logCall';
import * as reactifly from '../../src/index';

const VOID_ELEMENTS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;

function encodeEntities(str)
{
	return str.replace(/&/g, '&amp;');
}

export function serializeHtml(node) {
	let str = '';
	let child = node.firstChild;
	while (child) {
		str += serializeDomTree(child);
		child = child.nextSibling;
	}
	return str;
}

/**
 * Serialize a DOM tree.
 * Uses deterministic sorting where necessary to ensure consistent tests.
 * @param {Element|Node} node	The root node to serialize
 * @returns {string} html
 */
function serializeDomTree(node)
{
	if (node.nodeType === 3)
	{
		return encodeEntities(node.data);
	}
	else if (node.nodeType === 8)
	{
		return '<!--' + encodeEntities(node.data) + '-->';
	}
	else if (node.nodeType === 1 || node.nodeType === 9)
	{
		let str = '<' + node.localName;
		const attrs = [];
		for (let i = 0; i < node.attributes.length; i++) {
			attrs.push(node.attributes[i].name);
		}
		attrs.sort();
		for (let i = 0; i < attrs.length; i++) {
			const name = attrs[i];
			let value = node.getAttribute(name);

			// don't render attributes with null or undefined values
			if (value == null) continue;

			// normalize empty class attribute
			if (!value && name === 'class') continue;

			str += ' ' + name;
			value = encodeEntities(value);

			// normalize svg <path d="value">
			if (node.localName === 'path' && name === 'd') {
				value = normalizePath(value);
			}
			str += '="' + value + '"';
		}
		str += '>';

		// For elements that don't have children (e.g. <wbr />) don't descend.
		if (!VOID_ELEMENTS.test(node.localName)) {
			// IE puts the value of a textarea as its children while other browsers don't.
			// Normalize those differences by forcing textarea to not have children.
			if (node.localName != 'textarea') {
				let child = node.firstChild;
				while (child) {
					str += serializeDomTree(child);
					child = child.nextSibling;
				}
			}

			str += '</' + node.localName + '>';
		}
		return str;
	}
}


/**
 * Setup the test environment
 * @param {string} [id]
 * @returns {HTMLDivElement}
 */
export function setupScratch(id)
{
	let root = (document.body || document.documentElement);
	
	const scratch = document.createElement('div');
	
	scratch.id = id || 'scratch';
	
	root.appendChild(scratch);
	
	return scratch;
}

/**
 * Teardown test environment and reset preact's internal state
 * @param {HTMLDivElement} scratch
 */
export function teardown(scratch)
{	
	if (scratch)
	{
		scratch._reactiflyRootVnode = null;

		delete scratch._reactiflyRootVnode;

		scratch.removeAttribute('_reactiflyRootVnode');

		scratch.parentNode.removeChild(scratch);
	}

	if (getLog().length > 0)
	{
		clearLog();
	}

	restoreElementAttributes();
}

let attributesSpy, originalAttributesPropDescriptor;

function restoreElementAttributes()
{
	if (originalAttributesPropDescriptor)
	{
		// Workaround bug in Sinon where getter/setter spies don't get auto-restored
		Object.defineProperty(Element.prototype, 'attributes', originalAttributesPropDescriptor);
		attributesSpy = null;
	}
}

/**
 * Hacky normalization of attribute order across browsers.
 * @param {string} html
 */
export function sortAttributes(html)
{
	return html.replace(
		/<([a-z0-9-]+)((?:\s+[a-z0-9:_.-]+=".*?")+)((?:\s*\/)?>)/gi,
		(s, pre, attrs, after) => {
			let list = attrs.split(/\s/).filter(Boolean).map(e => e.trim()).sort((a, b) => (a > b ? 1 : -1));
			if (~after.indexOf('/')) after = '></' + pre + '>';
			return '<' + pre + ' ' + list.join(' ') + after;
		}
	);
}

const Foo = () => 'd';

export const getMixedArray = () => [ 0, 'a', 'b', reactifly.jsx(`<span>c</span>`), null, undefined, false, ['e', 'f'], 1];

export const mixedArrayHTML = '0ab<span>c</span>ef1';

