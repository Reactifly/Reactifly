import * as reactifly from '../../src/index';
import { setupScratch, teardown, serializeHtml, getMixedArray, mixedArrayHTML, sortAttributes } from '../_util/helpers';
import { clearLog, getLog, logCall } from '../_util/logCall';
import { expect } from 'chai';

const isIE11 = /Trident\//.test(navigator.userAgent);

function getAttributes(node)
{
	let attrs = {};
	
	for (let i = node.attributes.length; i--; )
	{
		attrs[node.attributes[i].name] = node.attributes[i].value;
	}

	return attrs;
}

describe('render()', () =>
{
	let scratch;
	let root;
	let instance;

	beforeEach(() =>
	{
		scratch = setupScratch();
		root = reactifly.createRoot(scratch);
	});

	afterEach(() =>
	{
		teardown(scratch);
	});

	it('should render an empty text node given an empty string', () =>
	{
		root.render('');
		let c = scratch.childNodes;
		expect(c).to.have.length(1);
		expect(c[0].data).to.equal('');
		expect(c[0].nodeName).to.equal('#text');
	});

	it('should re-render when value from "" to 0', () =>
	{
		root.render('');
		expect(scratch.innerHTML).to.equal('');

		root.render(0);
		expect(scratch.innerHTML).to.equal('0');

		root.render('');
		expect(scratch.innerHTML).to.equal('');
	});

	it('should allow node type change with content', () =>
	{
		root.render(`<span>Bad</span>`);
		expect(scratch.innerHTML).to.eql(`<span>Bad</span>`);

		root.render(`<div>Good</div>`);
		expect(scratch.innerHTML).to.eql(`<div>Good</div>`);
	});

	it('should create empty nodes (<* />)', () =>
	{
		root.render(`<div />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName.toUpperCase()).to.equal('DIV');

		teardown(scratch);
		scratch = setupScratch();
		root = reactifly.createRoot(scratch);

		root.render(`<span />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName.toUpperCase()).to.equal('SPAN');
	});

	it('should not throw error in IE11 with type date', () =>
	{
		expect(() => root.render(`<input type="date" />`)).to.not.throw();
	});

	it('should support custom tag names', () => 
	{
		root.render(`<foo />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName.toUpperCase()).to.equal('FOO');

		teardown(scratch);
		scratch = setupScratch();
		root = reactifly.createRoot(scratch);

		root.render(`<x-bar />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName.toUpperCase()).to.equal('X-BAR');
	});

	it('should support the form attribute', () => 
	{
		root.render(
			`<div>
				<form id="myform" />
				<button form="myform">test</button>
				<input form="myform" />
			</div>`
		);
		const div = scratch.childNodes[0];
		const form = div.childNodes[0];
		const button = div.childNodes[1];
		const input = div.childNodes[2];

		// IE11 doesn't support the form attribute
		if (!isIE11)
		{
			expect(button).to.have.property('form', form);
			expect(input).to.have.property('form', form);
		}
	});

	it('should allow VNode reuse', () =>
	{
		let reused = reactifly.jsx(`<div class="reuse">Hello World!</div>`);

		root.render(
			`<div>
				{reused}
				<hr />
				{reused}
			</div>`,
			{ reused: reused }
		);
		
		expect(serializeHtml(scratch)).to.eql(
			`<div><div class="reuse">Hello World!</div><hr><div class="reuse">Hello World!</div></div>`
		);

		root.render(
			`<div>
				<hr />
				{reused}
			</div>`,
			{ reused: reused }
		);

		expect(serializeHtml(scratch)).to.eql(
			`<div><hr><div class="reuse">Hello World!</div></div>`
		);
	});

	it('should merge new elements when called multiple times', () =>
	{
		root.render(`<div />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.firstChild).to.have.property('nodeName', 'Div');
		expect(scratch.innerHTML).to.equal('<div></div>');

		root.render(`<span />`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.firstChild).to.have.property('nodeName', 'Span');
		expect(scratch.innerHTML).to.equal('<span></span>');

		root.render(`<span class="hello">Hello!</span>`);
		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.firstChild).to.have.property('nodeName', 'Span');
		expect(scratch.innerHTML).to.equal('<span class="hello">Hello!</span>');
	});

	it('should nest empty nodes', () =>
	{
		root.render(`
			<div>
				<span />
				<foo />
				<x-bar />
			</div>
		`);

		expect(scratch.childNodes).to.have.length(1);
		expect(scratch.childNodes[0].nodeName).to.equal('Div');

		let c = scratch.childNodes[0].childNodes;
		expect(c).to.have.length(3);
		expect(c[0].nodeName).to.equal('Span');
		expect(c[1].nodeName).to.equal('Foo');
		expect(c[2].nodeName).to.equal('X-bar');
	});

	it('should not render falsy values', () =>
	{
		root.render(`
			<div>
				{null},{undefined},{false},{0},{NaN}
			</div>
		`);

		expect(scratch.firstChild).to.have.property('innerHTML', ',,,0,');
	});

	it('should not render null', () =>
	{
		root.render(null);
		expect(scratch.innerHTML).to.equal('');
		expect(scratch.childNodes).to.have.length(1);
	});

	it('should not render undefined', () =>
	{
		root.render(undefined);
		expect(scratch.innerHTML).to.equal('');
		expect(scratch.childNodes).to.have.length(1);
	});

	it('should not render boolean true', () =>
	{
		root.render(true);
		expect(scratch.innerHTML).to.equal('');
		expect(scratch.childNodes).to.have.length(1);
	});

	it('should not render boolean false', () =>
	{
		root.render(false);
		expect(scratch.innerHTML).to.equal('');
		expect(scratch.childNodes).to.have.length(1);
	});

	it('should not render children when using function children', () =>
	{
		root.render(`<div>{() => {}}</div>`);
		expect(scratch.innerHTML).to.equal('<div></div>');
	});

	it('should render NaN as text content ', () =>
	{
		root.render(NaN);
		expect(scratch.innerHTML).to.equal('NaN');
	});

	it('should render numbers (0) as text content', () =>
	{
		root.render(0);
		expect(scratch.innerHTML).to.equal('0');
	});

	it('should render numbers (42) as text content', () =>
	{
		root.render(42);
		expect(scratch.innerHTML).to.equal('42');
	});

	it('should render bigint as text content', () =>
	{
		// Skip in browsers not supporting big integers
		if (typeof BigInt === 'undefined')
		{
			return;
		}

		// eslint-disable-next-line no-undef, new-cap
		root.render(BigInt(4));
		expect(scratch.innerHTML).to.equal('4');
	});

	it('should render strings as text content', () =>
	{
		root.render('Testing, huh! How is it going?');

		expect(scratch.innerHTML).to.equal('Testing, huh! How is it going?');
	});

	it('should render arrays of mixed elements', () =>
	{
		root.render(getMixedArray());

		expect(scratch.innerHTML).to.equal(mixedArrayHTML);
	});

	it('should clear falsy attributes', () =>
	{
		root.render(`
			<div
				anull="anull"
				aundefined="aundefined"
				afalse="afalse"
				anan="aNaN"
				a0="a0"
			/>
		`);

		root.render(`
			<div
				anull={null}
				aundefined={undefined}
				afalse={false}
				a0={0}
			/>
		`);

		expect(
			getAttributes(scratch.firstChild),
			'from previous truthy values'
		).to.eql({
			a0: '0',
		});
	});

	it('should not render falsy attributes on hydrate', () =>
	{
		root.render(`
			<div
				anull={null}
				aundefined={undefined}
				afalse={false}
				a0={0}
			/>,
		`);

		expect(getAttributes(scratch.firstChild), 'initial render').to.eql({
			a0: '0',
		});
	});

	it('should clear falsy input values', () => {
		
		// Note: this test just demonstrates the default browser behavior
		root.render(`
			<div>
				<input value={0} />
				<input value={false} />
				<input value={null} />
				<input value={undefined} />
			</div>
		`);

		let div = scratch.firstChild;
		expect(div.children[0]).to.have.property('value', '0');
		expect(div.children[1]).to.have.property('value', 'false');
		expect(div.children[2]).to.have.property('value', '');
		expect(div.children[3]).to.have.property('value', '');
	});

	it('should set value inside the specified range', () =>
	{
		root.render(`
			<input type="range" value={0.5} min="0" max="1" step="0.05" />
		`);
		expect(scratch.firstChild.value).to.equal('0.5');
	});

	// IE or IE Edge will throw when attribute values don't conform to the
	// spec. That's the correct behaviour, but bad for this test...
	if (!/(Edge|MSIE|Trident)/.test(navigator.userAgent))
	{
		it('should not clear falsy DOM properties', () =>
		{
			function test(val)
			{
				reactifly.bind('val', val);

				root.render(`
					<div>
						<input value={val} />
						<table border={val} />
					</div>
				`);
			}

			test('2');
			test(false);
			expect(scratch.innerHTML).to.equal(
				'<div><input><table border="false"></table></div>',
				'for false'
			);

			test('3');
			test(null);
			expect(scratch.innerHTML).to.equal(
				'<div><input><table border=""></table></div>',
				'for null'
			);

			test('4');
			test(undefined);
			expect(scratch.innerHTML).to.equal(
				'<div><input><table border=""></table></div>',
				'for undefined'
			);
		});
	}

	it('should set enumerable boolean attribute', () =>
	{
		root.render(`<input checked={false} />`);
		expect(scratch.firstChild.checked).to.equal(false);
	});

	it('should render download attribute', () =>
	{
		root.render(`<a download="" />`);
		expect(scratch.firstChild.getAttribute('download')).to.equal('');

		root.render(`<a download={null} />`);
		expect(scratch.firstChild.getAttribute('download')).to.equal(null);
	});

	it('should not set tagName', () =>
	{
		expect(() => root.render(`<input tagName="div" />`)).not.to.throw();
	});

	it('should apply string attributes', () =>
	{
		root.render(`<div foo="bar" data-foo="databar" />`);
		expect(serializeHtml(scratch)).to.equal(
			'<div data-foo="databar" foo="bar"></div>'
		);
	});

	it('should not serialize function props as attributes', () =>
	{
		root.render(`<div click={function a() {}} ONCLICK={function b() {}} />`);

		let div = scratch.childNodes[0];

		expect(div.attributes.length).to.equal(0);
	});

	it('should serialize object props as attributes', () =>
	{
		root.render(`
			<div
				foo={{ a: 'b' }}
				bar={{
					toString() {
						return 'abc';
					}
				}}
			/>
		`);

		let div = scratch.childNodes[0];
		expect(div.attributes.length).to.equal(2);

		// Normalize attribute order because it's different in various browsers
		let normalized = {};
		for (let i = 0; i < div.attributes.length; i++) {
			let attr = div.attributes[i];
			normalized[attr.name] = attr.value;
		}

		expect(normalized).to.deep.equal({
			bar: 'abc',
			foo: '[object Object]'
		});
	});

	it('should apply class as String', () =>
	{
		root.render(`<div class="foo" />`);
		expect(scratch.childNodes[0]).to.have.property('className', 'foo');
	});

	it('should alias className to class', () =>
	{
		root.render(`<div className="bar" />`)
		expect(scratch.childNodes[0]).to.have.property('className', 'bar');
	});

	it('should support false string aria-* attributes', () =>
	{
		root.render(`<div aria-checked="false" />`)
		expect(scratch.firstChild.getAttribute('aria-checked')).to.equal('false');
	});

	it('should support false aria-* attributes', () =>
	{
		root.render(`<div aria-checked={false} />`)
		expect(scratch.firstChild.getAttribute('aria-checked')).to.equal('false');
	});

	it('should support false data-* attributes', () =>
	{
		root.render(`<div data-checked={false} />`)
		expect(scratch.firstChild.getAttribute('data-checked')).to.equal('false');
	});

	it('should set checked attribute on custom elements without checked property', () =>
	{
		root.render(`<checkboxed checked />`)
		expect(scratch.innerHTML).to.equal(
			'<checkboxed checked="true"></checkboxed>'
		);
	});

	it('should set value attribute on custom elements without value property', () =>
	{
		root.render(`<o-input value="test" />`)
		expect(scratch.innerHTML).to.equal('<o-input value="test"></o-input>');
	});

	it('should mask value on password input elements', () =>
	{
		root.render(`<input value="xyz" type="password" />`)
		expect(scratch.innerHTML).to.equal('<input type="password">');
	});

	it('should unset href if null || undefined', () =>
	{
		root.render(`
			<pre>
				<a href="#">href="#"</a>
				<a href={undefined}>href="undefined"</a>
				<a href={null}>href="null"</a>
				<a href={''}>href="''"</a>
			</pre>
		`);

		const links = scratch.querySelectorAll('a');
		expect(links[0].hasAttribute('href')).to.equal(true);
		expect(links[1].hasAttribute('href')).to.equal(false);
		expect(links[2].hasAttribute('href')).to.equal(false);
		expect(links[3].hasAttribute('href')).to.equal(true);
	});

	describe('dangerouslySetInnerHTML', () =>
	{
		it('should support dangerouslySetInnerHTML', () =>
		{
			let html = '<b>foo &amp; bar</b>';
			
			root.render(`<div dangerouslySetInnerHTML={{ __html: html }} />`, {html: html});

			expect(scratch.firstChild, 'set').to.have.property('innerHTML', html);
			expect(scratch.innerHTML).to.equal('<div>' + html + '</div>');

			root.render(`
				<div>
					a<strong>b</strong>
				</div>
			`);

			expect(scratch, 'unset').to.have.property(
				'innerHTML',
				`<div>a<strong>b</strong></div>`
			);

			// eslint-disable-next-line react/no-danger
			root.render(`<div dangerouslySetInnerHTML={{ __html: html }} />`, {html: html});
			expect(scratch.innerHTML, 're-set').to.equal('<div>' + html + '</div>');
		});

		it('should apply proper mutation for VNodes with dangerouslySetInnerHTML attr', () =>
		{
			let thing;

			class Thing extends reactifly.Component
			{
				constructor(props, context)
				{
					super(props, context);
					this.state = { html: this.props.html };
					thing = this;
				}
				render()
				{
					// eslint-disable-next-line react/no-danger
					return this.state.html ? (
						`<div dangerouslySetInnerHTML={{ __html: this.state.html }} />`
					) : (
						`<div />`
					);
				}
			}

			root.render(`<Thing html="<b><i>test</i></b>" />`, {Thing: Thing});
			expect(scratch.innerHTML).to.equal('<div><b><i>test</i></b></div>');

			thing.setState({ html: false });
			expect(scratch.innerHTML).to.equal('<div></div>');

			thing.setState({ html: '<foo><bar>test</bar></foo>' });
			expect(scratch.innerHTML).to.equal(
				'<div><foo><bar>test</bar></foo></div>'
			);
		});

		/*it('should not hydrate with dangerouslySetInnerHTML', () => {
			let html = '<b>foo &amp; bar</b>';
			scratch.innerHTML = `<div>${html}</div>`;
			// eslint-disable-next-line react/no-danger
			render(<div dangerouslySetInnerHTML={{ __html: html }} />, scratch);

			expect(scratch.firstChild).to.have.property('innerHTML', html);
			expect(scratch.innerHTML).to.equal(`<div>${html}</div>`);
		});*/

		it('should avoid reapplying innerHTML when __html property of dangerouslySetInnerHTML attr remains unchanged', () =>
		{
			let instance;

			class Thing extends reactifly.Component
			{
				ref = null;

				constructor(props)
				{
					super(props);

					instance = this;
				}

				render()
				{
					// eslint-disable-next-line react/no-danger
					return `<div ref={r => (this.ref = r)} dangerouslySetInnerHTML={{ __html: '<span>same</span>' }} />`;
				}
			}

			root.render(Thing);

			let firstInnerHTMLChild = scratch.firstChild.firstChild;

			// Re-render
			instance.forceUpdate();

			expect(firstInnerHTMLChild).to.equal(scratch.firstChild.firstChild);
		});

		it('should unmount dangerouslySetInnerHTML', () =>
		{
			let set;

			const TextDiv = () => `<div dangerouslySetInnerHTML={{ __html: '' }}>some text</div>`;

			class App extends reactifly.Component
			{
				TextDiv = TextDiv;

				constructor(props)
				{
					super(props);

					set = this.setState.bind(this);

					this.state = { show: true };
				}

				render()
				{
					return this.state.show ? `<TextDiv />` : null;
				}
			}

			root.render(App);
			expect(scratch.innerHTML).to.equal('<div></div>');

			set({ show: false });
			expect(scratch.innerHTML).to.equal('');
		});
	});

	it('should reconcile mutated DOM attributes', () =>
	{
		let check = p => root.render(`<input type="checkbox" checked={p} />`, {p: p}),
			value = () => scratch.lastChild.checked,
			setValue = p => (scratch.lastChild.checked = p);
		check(true);
		expect(value()).to.equal(true);
		check(false);
		expect(value()).to.equal(false);
		check(true);
		expect(value()).to.equal(true);
		setValue(true);
		check(false);
		expect(value()).to.equal(false);
		setValue(false);
		check(true);
		expect(value()).to.equal(true);
	});

	it('should reorder child pairs', () =>
	{
		root.render(`
			<div>
				<a>a</a>
				<b>b</b>
			</div>
		`);

		let a = scratch.firstChild.firstChild;
		let b = scratch.firstChild.lastChild;

		expect(a).to.have.property('nodeName', 'A');
		expect(b).to.have.property('nodeName', 'B');

		root.render(`
			<div>
				<b>b</b>
				<a>a</a>
			</div>`
		);

		expect(scratch.firstChild.firstChild).to.deep.equal(b);
		expect(scratch.firstChild.lastChild).to.deep.equal(a);
	});

/*
	

	

	

	

	// Discussion: https://github.com/preactjs/preact/issues/287
	// <datalist> is not supported in Safari, even though the element
	// constructor is present
	if (supportsDataList()) {
		it('should allow <input list /> to pass through as an attribute', () => {
			render(
				<div>
					<input type="range" min="0" max="100" list="steplist" />
					<datalist id="steplist">
						<option>0</option>
						<option>50</option>
						<option>100</option>
					</datalist>
				</div>,
				scratch
			);

			let html = scratch.firstElementChild.firstElementChild.outerHTML;
			expect(sortAttributes(html)).to.equal(
				sortAttributes('<input type="range" min="0" max="100" list="steplist">')
			);
		});
	}

	// Issue #2284
	it('should not throw when setting size to an invalid value', () => {
		// These values are usually used to reset the `size` attribute to its
		// initial state.
		expect(() => render(<input size={undefined} />, scratch)).to.not.throw();
		expect(() => render(<input size={null} />, scratch)).to.not.throw();
		expect(() => render(<input size={0} />, scratch)).to.not.throw();
	});

	it('should not execute append operation when child is at last', () => {
		// See preactjs/preact#717 for discussion about the issue this addresses

		let todoText = 'new todo that I should complete';
		let input;
		let setText;
		let addTodo;

		const ENTER = 13;

		class TodoList extends Component {
			constructor(props) {
				super(props);
				this.state = { todos: [], text: '' };
				setText = this.setText = this.setText.bind(this);
				addTodo = this.addTodo = this.addTodo.bind(this);
			}
			setText(e) {
				this.setState({ text: e.target.value });
			}
			addTodo(e) {
				if (e.keyCode === ENTER) {
					let { todos, text } = this.state;
					todos = todos.concat({ text });
					this.setState({ todos, text: '' });
				}
			}
			render() {
				const { todos, text } = this.state;
				return (
					<div onKeyDown={this.addTodo}>
						{todos.map(todo => [
							<span>{todo.text}</span>,
							<span>
								{' '}
								[ <a href="javascript:;">Delete</a> ]
							</span>,
							<br />
						])}
						<input value={text} onInput={this.setText} ref={i => (input = i)} />
					</div>
				);
			}
		}

		render(<TodoList />, scratch);

		// Simulate user typing
		input.focus();
		input.value = todoText;
		setText({
			target: input
		});

		// Commit the user typing setState call
		rerender();

		// Simulate user pressing enter
		addTodo({
			keyCode: ENTER
		});

		// Before Preact rerenders, focus should be on the input
		expect(document.activeElement).to.equalNode(input);

		rerender();

		// After Preact rerenders, focus should remain on the input
		expect(document.activeElement).to.equalNode(input);
		expect(scratch.innerHTML).to.contain(`<span>${todoText}</span>`);
	});

	it('should keep value of uncontrolled inputs', () => {
		render(<input value={undefined} />, scratch);
		scratch.firstChild.value = 'foo';
		render(<input value={undefined} />, scratch);
		expect(scratch.firstChild.value).to.equal('foo');
	});

	it('should keep value of uncontrolled checkboxes', () => {
		render(<input type="checkbox" checked={undefined} />, scratch);
		scratch.firstChild.checked = true;
		render(<input type="checkbox" checked={undefined} />, scratch);
		expect(scratch.firstChild.checked).to.equal(true);
	});

	// #2756
	it('should set progress value to 0', () => {
		render(<progress value={0} max="100" />, scratch);
		expect(scratch.firstChild.value).to.equal(0);
		expect(scratch.firstChild.getAttribute('value')).to.equal('0');
	});

	it('should always diff `checked` and `value` properties against the DOM', () => {
		// See https://github.com/preactjs/preact/issues/1324

		let inputs;
		let text;
		let checkbox;

		class Inputs extends Component {
			render() {
				return (
					<div>
						<input value={'Hello'} ref={el => (text = el)} />
						<input type="checkbox" checked ref={el => (checkbox = el)} />
					</div>
				);
			}
		}

		render(<Inputs ref={x => (inputs = x)} />, scratch);

		expect(text.value).to.equal('Hello');
		expect(checkbox.checked).to.equal(true);

		text.value = 'World';
		checkbox.checked = false;

		inputs.forceUpdate();
		rerender();

		expect(text.value).to.equal('Hello');
		expect(checkbox.checked).to.equal(true);
	});

	it('should always diff `contenteditable` `innerHTML` against the DOM', () => {
		// This tests that we do not cause any cursor jumps in contenteditable fields
		// See https://github.com/preactjs/preact/issues/2691

		function Editable() {
			const [value, setValue] = useState('Hello');

			return (
				<div
					contentEditable
					dangerouslySetInnerHTML={{ __html: value }}
					onInput={e => setValue(e.currentTarget.innerHTML)}
				/>
			);
		}

		render(<Editable />, scratch);

		let editable = scratch.querySelector('[contenteditable]');

		// modify the innerHTML and set the caret to character 2 to simulate a user typing
		editable.innerHTML = 'World';

		const range = document.createRange();
		range.selectNodeContents(editable);
		range.setStart(editable.childNodes[0], 2);
		range.collapse(true);
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);

		// ensure we didn't mess up setting the cursor to position 2
		expect(window.getSelection().getRangeAt(0).startOffset).to.equal(2);

		// dispatch the input event to tell preact to re-render
		editable.dispatchEvent(createEvent('input'));
		rerender();

		// ensure innerHTML is still correct (was not an issue before) and
		// more importantly the caret is still at character 2
		editable = scratch.querySelector('[contenteditable]');
		expect(editable.innerHTML).to.equal('World');
		expect(window.getSelection().getRangeAt(0).startOffset).to.equal(2);
	});

	it('should not re-render when a component returns undefined', () => {
		let Dialog = () => undefined;
		let updateState;
		class App extends Component {
			constructor(props) {
				super(props);
				this.state = { name: '' };
				updateState = () => this.setState({ name: ', friend' });
			}

			render(props, { name }) {
				return (
					<div>
						<Dialog />
						<h1 class="fade-down">Hi{name}</h1>
					</div>
				);
			}
		}

		render(<App />, scratch);
		clearLog();

		updateState();
		rerender();

		// We don't log text updates
		expect(getLog()).to.deep.equal([]);
	});

	it('should not lead to stale DOM nodes', () => {
		let i = 0;
		let updateApp;
		class App extends Component {
			render() {
				updateApp = () => this.forceUpdate();
				return <Parent />;
			}
		}

		let updateParent;
		function Parent() {
			updateParent = () => this.forceUpdate();
			i++;
			return <Child i={i} />;
		}

		function Child({ i }) {
			return i < 3 ? null : <div>foo</div>;
		}

		render(<App />, scratch);

		updateApp();
		rerender();
		updateParent();
		rerender();
		updateApp();
		rerender();

		// Without a fix it would render: `<div>foo</div><div></div>`
		expect(scratch.innerHTML).to.equal('<div>foo</div>');
	});

	// see preact/#1327
	it('should not reuse unkeyed components', () => {
		class X extends Component {
			constructor() {
				super();
				this.state = { i: 0 };
			}

			update() {
				this.setState(prev => ({ i: prev.i + 1 }));
			}

			componentWillUnmount() {
				clearTimeout(this.id);
			}

			render() {
				return <div>{this.state.i}</div>;
			}
		}

		let ref;
		let updateApp;
		class App extends Component {
			constructor() {
				super();
				this.state = { i: 0 };
				updateApp = () => this.setState(prev => ({ i: prev.i ^ 1 }));
			}

			render() {
				return (
					<div>
						{this.state.i === 0 && <X />}
						<X ref={node => (ref = node)} />
					</div>
				);
			}
		}

		render(<App />, scratch);
		expect(scratch.textContent).to.equal('00');

		ref.update();
		updateApp();
		rerender();
		expect(scratch.textContent).to.equal('1');

		updateApp();
		rerender();

		expect(scratch.textContent).to.equal('01');
	});

	it('should not cause infinite loop with referentially equal props', () => {
		let i = 0;
		let prevDiff = options._diff;
		options._diff = () => {
			if (++i > 10) {
				options._diff = prevDiff;
				throw new Error('Infinite loop');
			}
		};

		function App({ children, ...rest }) {
			return (
				<div {...rest}>
					<div {...rest}>{children}</div>
				</div>
			);
		}

		render(<App>10</App>, scratch);
		expect(scratch.textContent).to.equal('10');
		options._diff = prevDiff;
	});

	it('should not call options.debounceRendering unnecessarily', () => {
		let comp;

		class A extends Component {
			constructor(props) {
				super(props);
				this.state = { updates: 0 };
				comp = this;
			}

			render() {
				return <div>{this.state.updates}</div>;
			}
		}

		render(<A />, scratch);
		expect(scratch.innerHTML).to.equal('<div>0</div>');

		const sandbox = sinon.createSandbox();
		try {
			sandbox.spy(options, 'debounceRendering');

			comp.setState({ updates: 1 }, () => {
				comp.setState({ updates: 2 });
			});
			rerender();
			expect(scratch.innerHTML).to.equal('<div>2</div>');

			expect(options.debounceRendering).to.have.been.calledOnce;
		} finally {
			sandbox.restore();
		}
	});

	it('should remove attributes on pre-existing DOM', () => {
		const div = document.createElement('div');
		div.setAttribute('class', 'red');
		const span = document.createElement('span');
		const text = document.createTextNode('Hi');

		span.appendChild(text);
		div.appendChild(span);
		scratch.appendChild(div);

		const App = () => (
			<div>
				<span>Bye</span>
			</div>
		);

		render(<App />, scratch);
		expect(serializeHtml(scratch)).to.equal('<div><span>Bye</span></div>');
	});

	it('should remove class attributes', () => {
		const App = props => (
			<div className={props.class}>
				<span>Bye</span>
			</div>
		);

		render(<App class="hi" />, scratch);
		expect(scratch.innerHTML).to.equal(
			'<div class="hi"><span>Bye</span></div>'
		);

		render(<App />, scratch);
		expect(serializeHtml(scratch)).to.equal('<div><span>Bye</span></div>');
	});

	it('should not read DOM attributes on render without existing DOM', () => {
		const attributesSpy = spyOnElementAttributes();
		render(
			<div id="wrapper">
				<div id="page1">Page 1</div>
			</div>,
			scratch
		);
		expect(scratch.innerHTML).to.equal(
			'<div id="wrapper"><div id="page1">Page 1</div></div>'
		);

		// IE11 doesn't allow modifying Element.prototype functions properly.
		// Custom spies will never be called.
		if (!isIE11) {
			expect(attributesSpy.get).to.not.have.been.called;
		}

		render(
			<div id="wrapper">
				<div id="page2">Page 2</div>
			</div>,
			scratch
		);
		expect(scratch.innerHTML).to.equal(
			'<div id="wrapper"><div id="page2">Page 2</div></div>'
		);

		// IE11 doesn't allow modifying Element.prototype functions properly.
		// Custom spies will never be called.
		if (!isIE11) {
			expect(attributesSpy.get).to.not.have.been.called;
		}
	});

	// #2926
	it('should not throw when changing contentEditable to undefined or null', () => {
		render(<p contentEditable>foo</p>, scratch);

		expect(() =>
			render(<p contentEditable={undefined}>foo</p>, scratch)
		).to.not.throw();
		expect(scratch.firstChild.contentEditable).to.equal('inherit');

		expect(() =>
			render(<p contentEditable={null}>foo</p>, scratch)
		).to.not.throw();
		expect(scratch.firstChild.contentEditable).to.equal('inherit');
	});

	// #2926 Part 2
	it('should allow setting contentEditable to false', () => {
		render(
			<div contentEditable>
				<span>editable</span>
				<p contentEditable={false}>not editable</p>
			</div>,
			scratch
		);

		expect(scratch.firstChild.contentEditable).to.equal('true');
		expect(scratch.querySelector('p').contentEditable).to.equal('false');
	});

	// #3060
	it('should reset tabindex on undefined/null', () => {
		const defaultValue = isIE11 ? 0 : -1;

		render(<div tabIndex={0} />, scratch);
		expect(scratch.firstChild.tabIndex).to.equal(0);
		render(<div tabIndex={undefined} />, scratch);
		expect(scratch.firstChild.tabIndex).to.equal(defaultValue);
		render(<div tabIndex={null} />, scratch);
		expect(scratch.firstChild.tabIndex).to.equal(defaultValue);

		render(<div tabindex={0} />, scratch);
		expect(scratch.firstChild.tabIndex).to.equal(0);
		render(<div tabindex={undefined} />, scratch);
		expect(scratch.firstChild.tabIndex).to.equal(defaultValue);
		render(<div tabindex={null} />, scratch);
		expect(scratch.firstChild.tabIndex).to.equal(defaultValue);
	});*/

});