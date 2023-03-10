import * as reactifly from '../../src/index';
import { setupScratch, teardown, serializeHtml, getMixedArray, mixedArrayHTML, sortAttributes } from '../_util/helpers';
import { clearLog, getLog, logCall } from '../_util/logCall';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

function getAttributes(node)
{
	let attrs = {};

	if (node.attributes)
	{
		for (let i = node.attributes.length; i--; )
		{
			attrs[node.attributes[i].name] = node.attributes[i].value;
		}
	}

	return attrs;
}

describe('Components', () =>
{
	let scratch;
	let root;
	let instance;
	let PROPS;
	let STATE;

	beforeEach(() =>
	{
		scratch = setupScratch();
		root = reactifly.createRoot(scratch);
	});

	afterEach(() =>
	{
		teardown(scratch);
	});

	describe('Component construction', () =>
	{
		beforeEach(() =>
		{
			instance = null;
			PROPS = { foo: 'bar', onBaz: () => {} };
			STATE = { text: 'Hello' };
		});

		it('should render components', () =>
		{
			class ClassComp extends reactifly.Component
			{
				render()
				{
					return `<div>Foo</div>`;
				}
			}

			sinon.spy(ClassComp.prototype, 'render');
						
			root.render(ClassComp);

			expect(ClassComp.prototype.render)
				.to.have.been.calledOnce
				.and.to.have.returned(sinon.match('<div>Foo</div>'));
			
			expect(scratch.innerHTML).to.equal('<div>Foo</div>');
		});

		it('should render functional components', () =>
		{
			const FuncComp = sinon.spy(function(props)
			{
				return `<div {...props} />`;
			});

			root.render(`<FuncComp {...PROPS} />`, {FuncComp: FuncComp, PROPS: PROPS});

			expect(FuncComp).to.have.been.calledOnce.and.to.have.been.calledWithMatch(PROPS);
		
			expect(scratch.innerHTML).to.equal('<div foo="bar"></div>');
		});

		it('should render components with props', () =>
		{
			let constructorProps;

			class C2 extends reactifly.Component
			{
				constructor(props)
				{
					super(props);

					constructorProps = props;
				}
				
				render(props)
				{
					return `<div {...this.props} />`;
				}
			}

			sinon.spy(C2.prototype, 'render');

			root.render(`<C2 {...PROPS} />`, { C2: C2, PROPS: PROPS });

			expect(constructorProps).to.deep.equal(PROPS);

			expect(C2.prototype.render).to.have.been.calledOnce

			expect(scratch.innerHTML).to.equal('<div foo="bar"></div>');
		});

		it('should bind components from Component properties', () =>
		{
			const FuncComp = sinon.spy(function(props)
			{
				return `<div>FuncComp</div>`;
			});

			class ClassComp extends reactifly.Component
			{
				render()
				{
					return `<div>ClassComp</div>`;
				}
			}

			class Root extends reactifly.Component
			{
				FuncComp = FuncComp;

				ClassComp = ClassComp;

				render()
				{
					return `
						<Fragment>
							<ClassComp />
							<FuncComp />
						</Fragment>
					`;
				}
			}

			sinon.spy(ClassComp.prototype, 'render');

			reactifly.bind('Root', Root);

			root.render(Root);
			
			expect(FuncComp).to.have.been.calledOnce;
			expect(ClassComp.prototype.render).to.have.been.calledOnce;
		
			expect(scratch.innerHTML).to.equal('<div>ClassComp</div><div>FuncComp</div>');
		});

		it('should bind components from Component properties with aliases', () =>
		{
			const FuncComp = sinon.spy(function(props)
			{
				return `<div>FuncComp</div>`;
			});

			class ClassComp extends reactifly.Component
			{
				render()
				{
					return `<div>ClassComp</div>`;
				}
			}

			class Root extends reactifly.Component
			{
				Func = FuncComp;

				Comp = ClassComp;

				render()
				{
					return `
						<Fragment>
							<Comp />
							<Func />
						</Fragment>
					`;
				}
			}

			sinon.spy(ClassComp.prototype, 'render');

			reactifly.bind('Root', Root);

			root.render(Root);
			
			expect(FuncComp).to.have.been.calledOnce;
			expect(ClassComp.prototype.render).to.have.been.calledOnce;
		
			expect(scratch.innerHTML).to.equal('<div>ClassComp</div><div>FuncComp</div>');
		});

		it('should bind variables from Component properties', () =>
		{
			const MixedVars = 'Foo';

			class Root extends reactifly.Component
			{
				Foo = MixedVars;

				render()
				{
					return `<div>{Foo}</div>`;
				}
			}

			reactifly.bind('Root', Root);

			root.render(Root);
		
			expect(scratch.innerHTML).to.equal('<div>Foo</div>');
		});

		it('should bind variables with bind', () =>
		{
			const MixedVars = 'Foo';

			class Root extends reactifly.Component
			{
				render()
				{
					reactifly.bind('Foo', MixedVars);

					return `<div>{Foo}</div>`;
				}
			}

			reactifly.bind('Root', Root);

			root.render(Root);
		
			expect(scratch.innerHTML).to.equal('<div>Foo</div>');
		});

		it('should not crash when setting state in constructor', () =>
		{
			class Foo extends reactifly.Component
			{
				constructor(props)
				{
					super(props);
					
					this.setState({ preact: 'awesome' });
				}

				render()
				{
					return `<div>Foo</div>`;
				}
			}

			expect(() => root.render(`<Foo foo="bar" />`, { Foo: Foo })).not.to.throw();

		});

		it('should not crash when setting state with cb in constructor', () =>
		{
			let spy = sinon.spy();

			class Foo extends reactifly.Component
			{
				constructor(props)
				{
					super(props);

					this.setState({ preact: 'awesome' }, spy);
				}

				render()
				{
					return `<div>Foo</div>`;
				}
			}

			expect(() => root.render(`<Foo foo="bar" />`, { Foo: Foo })).not.to.throw();

			expect(spy).to.not.be.called;
		});

		it('should not crash when calling forceUpdate with cb in constructor', () =>
		{
			let spy = sinon.spy();

			class Foo extends reactifly.Component
			{
				constructor(props)
				{
					super(props);

					this.forceUpdate(spy);
				}

				render()
				{
					return `<div>Foo</div>`;
				}
			}

			expect(() => root.render(`<Foo foo="bar" />`, { Foo: Foo })).not.to.throw();
			
			expect(spy).to.not.be.called;
		});

		it('should accurately call nested setState callbacks', () =>
		{
			let states = [];
			let finalState;

			class Foo extends reactifly.Component
			{
				constructor(props)
				{
					super(props);

					this.state = { a: 'b' };
				}

				componentDidMount()
				{					
					states.push(this.state);

					expect(scratch.innerHTML).to.equal('<p>b</p>');

					this.setState({ a: 'a' }, () =>
					{
						states.push(this.state);

						expect(scratch.innerHTML).to.equal('<p>a</p>');

						this.setState({ a: 'c' }, () =>
						{
							expect(scratch.innerHTML).to.equal('<p>c</p>');

							states.push(this.state);
						});
					});
				}

				render()
				{
					finalState = this.state;

					return `<p>{this.state.a}</p>`;
				}
			}

			root.render(`<Foo />`, { Foo: Foo });
			
			let [firstState, secondState, thirdState] = states;
			
			expect(firstState).to.deep.equal({ a: 'b' });
			expect(secondState).to.deep.equal({ a: 'a' });
			expect(thirdState).to.deep.equal({ a: 'c' });
			expect(finalState).to.deep.equal({ a: 'c' });
		});

		it('should initialize props & context but not state in Component constructor', () =>
		{
			// Not initializing state matches React behavior: https://codesandbox.io/s/rml19v8o2q
			class Foo extends reactifly.Component
			{
				constructor(props, context)
				{
					super(props, context);
					
					expect(this.props).to.equal(props);
					
					expect(this.state).to.deep.equal({});
					
					expect(this.context).to.equal(context);

					instance = this;
				}

				render()
				{					
					return `<div {...this.props}>Hello</div>`;
				}
			}

			sinon.spy(Foo.prototype, 'render');

			root.render(`<Foo {...PROPS} />`, {Foo : Foo, PROPS: PROPS});

			expect(Foo.prototype.render).to.have.been.calledOnce;
			expect(instance.props).to.deep.equal(PROPS);
			expect(instance.state).to.deep.equal({});
			expect(instance.context).to.deep.equal({});

			expect(scratch.innerHTML).to.equal('<div foo="bar">Hello</div>');
		});

		it('should also update the current dom', () =>
		{
			let trigger;

			class A extends reactifly.Component
			{
				constructor(props)
				{
					super(props);
					
					this.state = { show: false };
					
					trigger = this.set = this.set.bind(this);
				}

				set()
				{
					this.setState({ show: true });
				}

				render()
				{
					return this.state.show ? `<div>A</div>` : null;
				}
			}

			const B = () => `<p>B</p>`;

			root.render(
				`<div>
					<A />
					<B />
				</div>`,
				{A: A, B: B}
			);

			expect(scratch.innerHTML).to.equal('<div><p>B</p></div>');

			trigger();
			
			expect(scratch.innerHTML).to.equal('<div><div>A</div><p>B</p></div>');
		});

		it("should NOT render Component classes that don't pass args into the Component constructor", () =>
		{
			function Foo()
			{
				reactifly.Component.call(this);
				
				instance = this;

				this.state = STATE;
			}
			
			Foo.prototype.render = () => 
			(
				`<div {...this.props}>{this.state.text}</div>`
			);

			expect(() => root.render(`<Foo foo="bar" />`, { Foo: Foo })).to.throw();
		});

		it("should render nested Component classes", () =>
		{
			class C extends reactifly.Component
			{

			}

			class B extends C
			{

			}

			class A extends B
			{
				render()
				{
					return `<p>Hello world!</p>`;
				}
			}

			sinon.spy(A.prototype, 'render');

			root.render(`<A />`, {A : A});

			expect(scratch.innerHTML).to.equal('<p>Hello world!</p>');

			expect(A.prototype.render).to.have.been.calledOnce;

		});

		it("should render nested Component classes with render overrides", () =>
		{
			class C extends reactifly.Component
			{
				render()
				{
					return `<p>Foo</p>`;
				}
			}

			class B extends C
			{
				render()
				{
					return `<p>Bar</p>`;
				}

			}

			class A extends B
			{
				render()
				{
					return `<p>Hello world!</p>`;
				}
			}

			sinon.spy(A.prototype, 'render');
			sinon.spy(B.prototype, 'render');
			sinon.spy(C.prototype, 'render');
			
			root.render(`<A />`, {A : A});

			expect(scratch.innerHTML).to.equal('<p>Hello world!</p>');

			expect(A.prototype.render).to.have.been.calledOnce;

			expect(B.prototype.render).to.not.be.called;

			expect(C.prototype.render).to.not.be.called;

		});

		it("should render Component classes that don't have a constructor", () =>
		{
			class Foo extends reactifly.Component
			{
				render()
				{					
					return `<div {...this.props}>Hello</div>`;
				}
			}

			sinon.spy(Foo.prototype, 'render');

			root.render(`<Foo {...PROPS} />`, {Foo : Foo, PROPS: PROPS});

			expect(Foo.prototype.render).to.have.been.calledOnce;

			expect(scratch.innerHTML).to.equal('<div foo="bar">Hello</div>');
		});

		it("should throw when components don't inherit from Component", () =>
		{
			class Foo
			{
				constructor()
				{
					this.state = STATE;
				}

				render(props, state)
				{
					return `<div>Hello</div>`;
				}
			}
			
			expect(() => root.render(`<Foo />`, { Foo: Foo })).to.throw();
		});

		it('should throw when class Component does not have a render method', () =>
		{
			class Foo extends reactifly.Component
			{
			}

			expect(() => root.render(`<Foo />`, { Foo: Foo })).to.throw();
		});

		it('should not orphan children', () =>
		{
			let triggerC, triggerA;

			const B = () => `<p>B</p>`;

			// Component with state which swaps its returned element type
			class C extends reactifly.Component
			{
				constructor(props)
				{
					super(props);

					this.state = { show: false };
					
					triggerC = this.set = this.set.bind(this);
				}

				set()
				{
					this.setState({ show: true });
				}

				render()
				{
					return this.state.show ? `<div>data</div>` : `<p>Loading</p>`;
				}
			}

			const WrapC = () =>
			{
				reactifly.bind('C', C);

				return `<C />`;
			}

			class A extends reactifly.Component
			{
				B = B;

				WrapC = WrapC;

				constructor(props)
				{
					super(props);

					this.state = { show: false };
					
					triggerA = this.set = this.set.bind(this);
				}

				set()
				{
					this.setState({ show: true });
				}

				render()
				{
					return this.state.show ? `<B />` : `<WrapC />`;
				}
			}

			root.render(`<A />`, {A: A});
			expect(scratch.innerHTML).to.equal('<p>Loading</p>');

			triggerC();
			expect(scratch.innerHTML).to.equal('<div>data</div>');

			triggerA();
			expect(scratch.innerHTML).to.equal('<p>B</p>');
		});

	});

	it('should render string', () =>
	{
		class StringComponent extends reactifly.Component
		{
			render()
			{
				return 'Hi there';
			}
		}

		root.render(`<StringComponent />`, {StringComponent: StringComponent});

		expect(scratch.innerHTML).to.equal('Hi there');
	});

	it('should render number as string', () =>
	{
		class NumberComponent extends reactifly.Component
		{
			render()
			{
				return 42;
			}
		}

		root.render(`<NumberComponent />`, {NumberComponent: NumberComponent});

		expect(scratch.innerHTML).to.equal('42');
	});

	it('should render null as empty string', () =>
	{
		class NullComponent extends reactifly.Component
		{
			render()
			{
				return null;
			}
		}

		root.render(`<NullComponent />`, {NullComponent: NullComponent});

		expect(scratch.innerHTML).to.equal('');
	});

	it('should remove orphaned elements replaced by Components', () =>
	{
		class Comp extends reactifly.Component
		{
			render()
			{
				return `<span>span in a component</span>`;
			}
		}

		function test(content)
		{
			reactifly.bind('Comp', Comp);

			root.render(content);
		}

		test(`<Comp />`);
		test(`<div>just a div</div>`);
		test(`<Comp />`);

		expect(scratch.innerHTML).to.equal('<span>span in a component</span>');
	});

	it('should remove children when root changes to text node', () =>
	{
		class Comp extends reactifly.Component
		{
			constructor()
			{
				super();

				instance = this;
			}
			render()
			{
				return this.state.alt ? 'asdf' : `<div>test</div>`;
			}
		}

		root.render(`<Comp />`, {Comp: Comp});

		instance.setState({ alt: true });
		instance.forceUpdate();
		expect(scratch.innerHTML, 'switching to textnode').to.equal('asdf');

		instance.setState({ alt: false });
		instance.forceUpdate();
		expect(scratch.innerHTML, 'switching to element').to.equal(
			'<div>test</div>'
		);

		instance.setState({ alt: true });
		instance.forceUpdate();
		expect(scratch.innerHTML, 'switching to textnode 2').to.equal('asdf');
	});

	it('should maintain order when setting state (that inserts dom-elements)', () =>
	{
		let add, addTwice, reset;

		const Entry = props => `<div>{props.children}</div>`;

		class App extends reactifly.Component
		{
			Entry = Entry;

			constructor(props)
			{
				super(props);

				this.state = { values: ['abc'] };

				add = this.add = this.add.bind(this);
				addTwice = this.addTwice = this.addTwice.bind(this);
				reset = this.reset = this.reset.bind(this);
			}

			add()
			{
				this.setState({ values: [...this.state.values, 'def'] });
			}

			addTwice()
			{
				this.setState({ values: [...this.state.values, 'def', 'ghi'] });
			}

			reset()
			{
				this.setState({ values: ['abc'] });
			}

			render()
			{
				return (`
					<div>
						{this.state.values.map((v, i) => (
							<Entry key={i + v}>{v}</Entry>
						))}
						<button>First Button</button>
						<button>Second Button</button>
						<button>Third Button</button>
					</div>
				`);
			}
		}

		const btnStr = '<button>First Button</button><button>Second Button</button><button>Third Button</button>';

		root.render(App);
		expect(scratch.firstChild.innerHTML).to.equal(
			'<div>abc</div>' + btnStr
		);

		add();
		//rerender();
		expect(scratch.firstChild.innerHTML).to.equal(
			'<div>abc</div><div>def</div>' + btnStr
		);

		add();
		//rerender();

		expect(scratch.firstChild.innerHTML).to.equal(
			'<div>abc</div><div>def</div><div>def</div>' + btnStr
		);

		reset();
		//rerender();
		expect(scratch.firstChild.innerHTML).to.equal(
			'<div>abc</div>' + btnStr
		);

		addTwice();
		//rerender();
		expect(scratch.firstChild.innerHTML).to.equal(
			'<div>abc</div><div>def</div><div>ghi</div>' + btnStr
		);
	});

	it('should not recycle common class children with different keys', () =>
	{
		let idx = 0;
		let msgs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
		let sideEffect = sinon.spy();

		class Comp extends reactifly.Component
		{
			componentWillMount()
			{
				this.innerMsg = msgs[idx++ % 8];

				sideEffect();
			}

			render()
			{
				return `<div>{this.innerMsg}</div>`;
			}
		}

		sinon.spy(Comp.prototype, 'componentWillMount');

		let good, bad;

		class GoodContainer extends reactifly.Component
		{
			constructor(props)
			{
				super(props);

				this.state = { alt: false };

				good = this;
			}

			render()
			{
				//reactifly.bind('alt', this.state.alt);
				reactifly.bind('Comp', Comp);

				return `
					<div>
						{this.state.alt ? null : (<Comp key={1} alt={this.state.alt} />)}
						{this.state.alt ? null : (<Comp key={2} alt={this.state.alt} />)}
						{this.state.alt ? (<Comp key={3} alt={this.state.alt} />) : null}
					</div>
				`;
			}
		}

		class BadContainer extends reactifly.Component
		{
			constructor(props)
			{
				super(props);

				this.state = { alt: false };

				bad = this;
			}

			render()
			{
				reactifly.bind('Comp', Comp);

				return `
					<div>
						{this.state.alt ? null : (<Comp alt={this.state.alt} />)}
						{this.state.alt ? null : (<Comp alt={this.state.alt} />)}
						{this.state.alt ? (<Comp alt={this.state.alt} />) : null}
					</div>
				`;
			}
		}

		root.render(GoodContainer);
		expect(scratch.textContent, 'new component with key present').to.equal('AB');
		expect(Comp.prototype.componentWillMount).to.have.been.calledTwice;
		expect(sideEffect).to.have.been.calledTwice;

		sideEffect.resetHistory();
		Comp.prototype.componentWillMount.resetHistory();
		good.setState({ alt: true });

		//rerender();
		expect(scratch.textContent, 'new component with key present re-rendered').to.equal('C');
		
		// we are recycling the first 2 components already rendered, just need a new one
		expect(Comp.prototype.componentWillMount).to.have.been.calledOnce;
		expect(sideEffect).to.have.been.calledOnce;

		sideEffect.resetHistory();
		Comp.prototype.componentWillMount.resetHistory();
		root.render(BadContainer);
		expect(scratch.textContent, 'new component without key').to.equal('DE');
		expect(Comp.prototype.componentWillMount).to.have.been.calledTwice;
		expect(sideEffect).to.have.been.calledTwice;

		sideEffect.resetHistory();
		Comp.prototype.componentWillMount.resetHistory();
		bad.setState({ alt: true });

		expect(scratch.textContent,'use null placeholders to detect new component is appended').to.equal('D');
		expect(Comp.prototype.componentWillMount).to.not.be.called;
		expect(sideEffect).to.not.be.called;
	});

	/*describe('JSX function interpolation', () =>
	{
		it("should render DOM element's array children", () =>
		{
			class Root extends reactifly.Component
			{
				returnStr()
				{
					return 'foo';
				}

				returnArray()
				{
					return [1, 2, 3];
				}

				returnJsx()
				{
					return reactifly.jsx('<div>jsx</div>');
				}

				render()
				{
					return 
				}

			}

			root.render(`<div>{getMixedArray()}</div>`);

			expect(scratch.firstChild.innerHTML).to.equal(mixedArrayHTML);
		});

	});*/
	
	describe('array children', () =>
	{
		it("should render DOM element's array children", () =>
		{
			reactifly.bind('getMixedArray', getMixedArray);

			root.render(`<div>{getMixedArray()}</div>`);

			expect(scratch.firstChild.innerHTML).to.equal(mixedArrayHTML);
		});

		it("should render Component's array children", () =>
		{
			const Foo = () => getMixedArray();

			root.render(Foo);

			expect(scratch.innerHTML).to.equal(mixedArrayHTML);
		});

		it("should render Fragment's array children", () =>
		{
			reactifly.bind('getMixedArray', getMixedArray);

			const Foo = () => `<Fragment>{getMixedArray()}</Fragment>`;

			root.render(Foo);

			expect(scratch.innerHTML).to.equal(mixedArrayHTML);
		});

		it('should render array map', () =>
		{
			class MapComponent extends reactifly.Component
			{
				render()
				{
					return '<span>{[1,2,3].map(el=> (<div>{el}</div>))}</span>';
				}
			}

			root.render(MapComponent);

			expect(scratch.innerHTML).to.equal('<span><div>1</div><div>2</div><div>3</div></span>');
		});


		it('should render sibling array children', () =>
		{
			const Todo = () => (`
				<ul>
					<li>A header</li>
					{['a', 'b'].map(value =>
					(
						<li>{value}</li>
					))}
					<li>A divider</li>
					{['c', 'd'].map(value =>
					(
						<li>{value}</li>
					))}
					<li>A footer</li>
				</ul>
			`);

			root.render(Todo);

			let ul = scratch.firstChild;
			expect(ul.childNodes.length).to.equal(7);
			expect(ul.childNodes[0].textContent).to.equal('A header');
			expect(ul.childNodes[1].textContent).to.equal('a');
			expect(ul.childNodes[2].textContent).to.equal('b');
			expect(ul.childNodes[3].textContent).to.equal('A divider');
			expect(ul.childNodes[4].textContent).to.equal('c');
			expect(ul.childNodes[5].textContent).to.equal('d');
			expect(ul.childNodes[6].textContent).to.equal('A footer');
		});
	});

	describe('props.children', () =>
	{
		let children;

		let Foo = props =>
		{
			children = props.children;

			return `<div>{props.children}</div>`;
		};

		let FunctionFoo = props =>
		{
			children = props.children;

			return `<div>{props.children[0](2)}</div>`;
		};

		let Bar = () => `<span>Bar</span>`;

		beforeEach(() =>
		{
			children = undefined;
		});

		it('should support passing children as a prop', () =>
		{
			const Foo = props => `<div {...props} />`;

			reactifly.bind('Foo', Foo);

			root.render(`<Foo a="b" children={[<span class="bar">bar</span>, '123', 456]} />`);

			expect(scratch.innerHTML).to.equal(
				'<div a="b"><span class="bar">bar</span>123456</div>'
			);
		});

		it('should be ignored when explicit children exist', () =>
		{
			const Foo = props => `<div {...props}>a</div>`;

			reactifly.bind('Foo', Foo);

			root.render(`<Foo children={'b'} />`);

			expect(scratch.innerHTML).to.equal('<div>a</div>');
		});

		it('should be undefined with no child', () =>
		{
			root.render(Foo);
			
			expect(children).to.be.undefined;
			
			expect(scratch.innerHTML).to.equal('<div></div>');

		});

		it('should be undefined with null as a child', () =>
		{
			reactifly.bind('Foo', Foo);

			root.render(`<Foo>{null}</Foo>`);

			expect(children).to.be.undefined;
			
			expect(scratch.innerHTML).to.equal('<div></div>');
		});

		it('should be undefined with false as a child', () =>
		{
			reactifly.bind('Foo', Foo);

			root.render(`<Foo>{false}</Foo>`);

			expect(children).to.be.undefined;
			
			expect(scratch.innerHTML).to.equal('<div></div>');
		});

		/*it('should be true with true as a child', () =>
		{
			reactifly.bind('Foo', Foo);

			root.render(`<Foo>{true}</Foo>`);

			expect(children).to.be.undefined;
			
			expect(scratch.innerHTML).to.equal('<div></div>');
		});*/

		it('should be a vnode with a text child', () =>
		{
			reactifly.bind('Foo', Foo);

			root.render(`<Foo>text</Foo>`);

			expect(children.length).to.equal(1);
			expect(children[0]).to.be.a('object');
			expect(children[0].type).to.equal('text');
			expect(children[0].nodeValue).to.equal('text');
			expect(scratch.innerHTML).to.equal('<div>text</div>');
		});

		it('should be a vnode with a number child', () =>
		{
			reactifly.bind('Foo', Foo);

			root.render(`<Foo>1</Foo>`);

			expect(children.length).to.equal(1);
			expect(children[0]).to.be.a('object');
			expect(children[0].type).to.equal('text');
			expect(children[0].nodeValue).to.equal('1');
			expect(scratch.innerHTML).to.equal('<div>1</div>');
		});

		it('should be a VNode with a DOM node child', () =>
		{
			reactifly.bind('Foo', Foo);

			root.render(`
				<Foo>
					<span />
				</Foo>
			`);

			expect(children.length).to.equal(1);
			expect(children[0]).to.be.a('object');
			expect(children[0].type).to.equal('native');
			expect(children[0].tagName).to.equal('span');
			expect(scratch.innerHTML).to.equal('<div><span></span></div>');
		});

		it('should be a VNode with a Component child', () =>
		{
			reactifly.bind('Foo', Foo);
			reactifly.bind('Bar', Bar);

			root.render(`
				<Foo>
					<Bar />
				</Foo>
			`);

			expect(children.length).to.equal(1);
			expect(children[0]).to.be.a('object');
			expect(children[0].type).to.equal('thunk');
			expect(children[0].__internals._fn).to.equal(Bar);
			expect(scratch.innerHTML).to.equal('<div><span>Bar</span></div>');
		});

		it('should be a function with a function child', () =>
		{
			const child = num => num.toFixed(2);

			reactifly.bind('child', child);
			reactifly.bind('FunctionFoo', FunctionFoo);

			root.render(`<FunctionFoo>{child}</FunctionFoo>`);

			expect(children[0]).to.be.an('function');
			expect(children[0]).to.equal(child);
			expect(scratch.innerHTML).to.equal('<div>2.00</div>');
		});

		it('should be an array with multiple children', () =>
		{
			reactifly.bind('Foo', Foo);

			root.render(`
				<Foo>
					0<span />
					<input />
					<div />1
				</Foo>
			`);

			expect(children).to.be.an('array');
			expect(children[0].nodeValue).to.equal('0');
			expect(children[1].tagName).to.equal('span');
			expect(children[2].tagName).to.equal('input');
			expect(children[3].tagName).to.equal('div');
			expect(children[4].nodeValue).to.equal('1');
			expect(scratch.innerHTML).to.equal(
				`<div>0<span></span><input><div></div>1</div>`
			);
		});

		it('should be an array with an Vnodes as children', () =>
		{
			const mixedArray = getMixedArray();

		    reactifly.bind('mixedArray', mixedArray);

		    reactifly.bind('Foo', Foo);

		    root.render(`<Foo>{mixedArray}</Foo>`);

			expect(children).to.be.an('array');
			expect(children.length).to.equal(mixedArray.length + 1);
			expect(scratch.innerHTML).to.equal(`<div>${mixedArrayHTML}</div>`);
		});

		it('should flatten sibling and nested arrays', () =>
		{
			const list1 = [0, 1];
			const list2 = [2, 3];
			const list3 = [4, 5];
			const list4 = [6, 7];
			const list5 = [8, 9];

			reactifly.bind('Foo', Foo);

			reactifly.bind({list1 : list1, list2 : list2, list3 : list3, list4: list4, list5 : list5});

			root.render(`
				<Foo>
					{[list1, list2]}
					{[list3, list4]}
					{list5}
				</Foo>
			`);

			expect(children).to.be.an('array');
			expect(children.length).to.equal(10);
			expect(scratch.innerHTML).to.equal('<div>0123456789</div>');
		});

	});
	
	describe('High-Order Components', () =>
	{
		it('should render wrapper HOCs', () =>
		{
			const text = "We'll throw some happy little limbs on this tree.";

			function withBobRoss(ChildComponent)
			{
				return class BobRossIpsum extends reactifly.Component
				{
					render(props)
					{
						reactifly.bind('text', text);

						reactifly.bind('ChildComponent', ChildComponent);

						return `<ChildComponent {...props} text={text} />`;
					}
				};
			}

			const PaintSomething = (props) =>
			{
				return `<div>{props.text}</div>`;
			}

			const Paint = withBobRoss(PaintSomething);

			root.render(Paint);

			expect(scratch.innerHTML).to.equal(`<div>${text}</div>`);
		});

		it('should render nested functional components', () =>
		{
			const PROPS = { foo: 'bar', onBaz: () => {} };

			const Inner = sinon.spy(props => `<div {...props}>inner</div>`);

			const Outer = sinon.spy(props =>
			{
				reactifly.bind('Inner', Inner);

				return `<Inner {...props} />`;
			});
			
			reactifly.bind('Outer', Outer);

			reactifly.bind('PROPS', PROPS);

			root.render(`<Outer {...PROPS} />`);

			expect(Outer).to.have.been.calledOnce.and.to.have.been.calledWithMatch(PROPS)
				
			expect(Inner).to.have.been.calledOnce.and.to.have.been.calledWithMatch(PROPS);

			expect(scratch.innerHTML).to.equal('<div foo="bar">inner</div>');
		});

		it('should re-render nested functional components', () =>
		{
			let doRender = null;

			let j = 0;

			const Inner = sinon.spy(props =>
			{
				reactifly.bind('j', ++j);

				return `<div j={j} {...props}>inner</div>`;
			});

			class Outer extends reactifly.Component
			{
				Inner = Inner;

				componentDidMount()
				{
					let i = 1;

					doRender = () => this.setState({ i: ++i });
				}

				componentWillUnmount() {}

				render()
				{
					return `<Inner i={this.state.i} {...this.props} />`;
				}
			}

			sinon.spy(Outer.prototype, 'render');
			sinon.spy(Outer.prototype, 'componentWillUnmount');

			reactifly.bind('Outer', Outer);

			root.render(`<Outer foo="bar" />`);

			// update & flush
			doRender();

			expect(Outer.prototype.componentWillUnmount).not.to.have.been.called;

			expect(Inner).to.have.been.calledTwice;

			expect(Inner.secondCall).to.have.been.calledWithMatch({ foo: 'bar', i: 2 });

			expect(getAttributes(scratch.firstElementChild)).to.eql({
				j: '2',
				i: '2',
				foo: 'bar'
			});

			// update & flush
			doRender();

			expect(Inner).to.have.been.calledThrice;

			expect(Inner.thirdCall).to.have.been.calledWithMatch({ foo: 'bar', i: 3 });

			expect(getAttributes(scratch.firstElementChild)).to.eql({
				j: '3',
				i: '3',
				foo: 'bar'
			});
		});

		it('should re-render nested components', () =>
		{
			let doRender = null,
				alt = false;

			let j = 0;

			class Inner extends reactifly.Component
			{
				constructor(props)
				{
					super(props);
				}

				componentWillMount() {}
				componentDidMount() {}
				componentWillUnmount() {}
				
				render()
				{
					reactifly.bind('j', ++j);

					return `
						<div j={j} {...this.props}>
							inner
						</div>
					`;
				}
			}

			sinon.spy(Inner.prototype, 'render');
			sinon.spy(Inner.prototype, 'componentWillMount');
			sinon.spy(Inner.prototype, 'componentDidMount');
			sinon.spy(Inner.prototype, 'componentWillUnmount');

			class Outer extends reactifly.Component
			{
				Inner = Inner;

				componentDidMount()
				{
					let i = 1;
					
					doRender = () => this.setState({ i: ++i });
				}

				componentWillUnmount() {}
				
				render()
				{
					if (alt) return `<div is-alt="true" />`;
					
					return `<Inner i={this.state.i} {...this.props} />`;
				}
			}

			sinon.spy(Outer.prototype, 'render');
			sinon.spy(Outer.prototype, 'componentDidMount');
			sinon.spy(Outer.prototype, 'componentWillUnmount');

			reactifly.bind('Outer', Outer);

			root.render(`<Outer foo="bar" />`);

			expect(Outer.prototype.componentDidMount).to.have.been.calledOnce;

			// update & flush
			doRender();

			expect(Outer.prototype.componentWillUnmount).not.to.have.been.called;

			expect(Inner.prototype.componentWillUnmount).not.to.have.been.called;
			expect(Inner.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Inner.prototype.componentDidMount).to.have.been.calledOnce;
			expect(Inner.prototype.render).to.have.been.calledTwice;

			expect(Inner.prototype.render.secondCall).to.have.been.calledWithMatch({ foo: 'bar', i: 2 })

			expect(getAttributes(scratch.firstElementChild)).to.eql({
				j: '2',
				i: '2',
				foo: 'bar'
			});

			expect(serializeHtml(scratch)).to.equal(
				sortAttributes('<div foo="bar" j="2" i="2">inner</div>')
			);

			// update & flush
			doRender();

			expect(Inner.prototype.componentWillUnmount).not.to.have.been.called;
			expect(Inner.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Inner.prototype.componentDidMount).to.have.been.calledOnce;
			expect(Inner.prototype.render).to.have.been.calledThrice;

			expect(Inner.prototype.render.thirdCall).to.have.been.calledWithMatch({ foo: 'bar', i: 3 })

			expect(getAttributes(scratch.firstElementChild)).to.eql({
				j: '3',
				i: '3',
				foo: 'bar'
			});

			alt = true;
			doRender();

			expect(Inner.prototype.componentWillUnmount).to.have.been.calledOnce;
			expect(scratch.innerHTML).to.equal('<div is-alt="true"></div>');

			alt = false;
			doRender();

			expect(serializeHtml(scratch)).to.equal(
				sortAttributes('<div foo="bar" j="4" i="5">inner</div>')
			);
		});

		it('should resolve intermediary functional component', () =>
		{
			let ctx = {};

			class Inner extends reactifly.Component
			{
				componentWillMount()
				{}
				componentDidMount()
				{}
				componentWillUnmount()
				{}
				render()
				{
					return `<div>inner</div>`;
				}
			}

			const Func = () => 
			{
				reactifly.bind('Inner', Inner);

				return `<Inner />`;
			}

			class Root extends reactifly.Component
			{
				Func = Func;

				getChildContext()
				{
					return { ctx };
				}

				render()
				{
					return `<Func />`;
				}
			}

			sinon.spy(Inner.prototype, 'componentWillUnmount');
			sinon.spy(Inner.prototype, 'componentWillMount');
			sinon.spy(Inner.prototype, 'componentDidMount');
			sinon.spy(Inner.prototype, 'render');

			reactifly.bind('Root', Root);
			root.render(Root);

			expect(Inner.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Inner.prototype.componentDidMount).to.have.been.calledOnce;
			expect(Inner.prototype.componentWillMount).to.have.been.calledBefore(
				Inner.prototype.componentDidMount
			);

			root.render(`<asdf />`);

			expect(Inner.prototype.componentWillUnmount).to.have.been.calledOnce;
		});

		it('should unmount children of high-order components without unmounting parent', () =>
		{
			let outer,
				inner2,
				counter = 0;

			class Inner2 extends reactifly.Component
			{
				constructor(props, context)
				{
					super(props, context);
					inner2 = this;
				}
				componentWillUnmount()
				{}
				componentWillMount()
				{}
				componentDidMount()
				{}

				render()
				{
					return ++counter;
				}
			}
			sinon.spy(Inner2.prototype, 'componentWillUnmount');
			sinon.spy(Inner2.prototype, 'componentWillMount');
			sinon.spy(Inner2.prototype, 'componentDidMount');
			sinon.spy(Inner2.prototype, 'render');

			class Inner extends reactifly.Component
			{
				componentWillUnmount()
				{}
				componentWillMount()
				{}
				componentDidMount()
				{}
				render()
				{
					return ++counter;
				}
			}
			sinon.spy(Inner.prototype, 'componentWillUnmount');
			sinon.spy(Inner.prototype, 'componentWillMount');
			sinon.spy(Inner.prototype, 'componentDidMount');
			sinon.spy(Inner.prototype, 'render');

			class Outer extends reactifly.Component
			{
				constructor(props, context)
				{
					super(props, context);

					outer = this;
					
					this.state =
					{
						child: this.props.child
					};
				}

				componentWillUnmount()
				{}
				componentWillMount()
				{}
				componentDidMount()
				{}
				render()
				{
					reactifly.bind('InnerChild', this.state.child);

					return `<InnerChild />`;
				}
			}
			sinon.spy(Outer.prototype, 'componentWillUnmount');
			sinon.spy(Outer.prototype, 'componentWillMount');
			sinon.spy(Outer.prototype, 'componentDidMount');
			sinon.spy(Outer.prototype, 'render');

			root.render(`<Outer child={Inner} />`, { Outer: Outer, Inner: Inner });

			// outer should only have been mounted once
			expect(Outer.prototype.componentWillMount, 'outer initial').to.have.been
				.calledOnce;
			expect(Outer.prototype.componentDidMount, 'outer initial').to.have.been
				.calledOnce;
			expect(Outer.prototype.componentWillUnmount, 'outer initial').not.to.have
				.been.called;

			// inner should only have been mounted once
			expect(Inner.prototype.componentWillMount, 'inner initial').to.have.been
				.calledOnce;
			expect(Inner.prototype.componentDidMount, 'inner initial').to.have.been
				.calledOnce;
			expect(Inner.prototype.componentWillUnmount, 'inner initial').not.to.have
				.been.called;

			outer.setState({ child: Inner2 });
			//outer.forceUpdate();
			//rerender();

			expect(Inner2.prototype.render).to.have.been.calledOnce;

			// outer should still only have been mounted once
			expect(Outer.prototype.componentWillMount, 'outer swap').to.have.been
				.calledOnce;
			expect(Outer.prototype.componentDidMount, 'outer swap').to.have.been
				.calledOnce;
			expect(Outer.prototype.componentWillUnmount, 'outer swap').not.to.have
				.been.called;

			// inner should only have been mounted once
			expect(Inner2.prototype.componentWillMount, 'inner2 swap').to.have.been
				.calledOnce;
			expect(Inner2.prototype.componentDidMount, 'inner2 swap').to.have.been
				.calledOnce;
			expect(Inner2.prototype.componentWillUnmount, 'inner2 swap').not.to.have
				.been.called;

			inner2.forceUpdate();
			//rerender();

			expect(Inner2.prototype.render, 'inner2 update').to.have.been.calledTwice;
			expect(Inner2.prototype.componentWillMount, 'inner2 update').to.have.been
				.calledOnce;
			expect(Inner2.prototype.componentDidMount, 'inner2 update').to.have.been
				.calledOnce;
			expect(Inner2.prototype.componentWillUnmount, 'inner2 update').not.to.have
				.been.called;
		});

		it('should remount when swapping between HOC child types', () =>
		{
			class Inner extends reactifly.Component
			{
				componentWillMount()
				{}
				componentWillUnmount()
				{}
				render()
				{
					return `<div class="inner">foo</div>`;
				}
			}

			class Outer extends reactifly.Component
			{
				render({ child: Child })
				{
					reactifly.bind('Child', Child);
					
					return `<Child />`;
				}
			}

			const InnerFunc = () => `<div class="inner-func">bar</div>`;

			sinon.spy(Inner.prototype, 'componentWillMount');
			sinon.spy(Inner.prototype, 'componentWillUnmount');
			sinon.spy(Inner.prototype, 'render');

			root.render(`<Outer child={Inner} />`, { Outer: Outer, Inner: Inner });

			expect(Inner.prototype.componentWillMount, 'initial mount').to.have.been
				.calledOnce;
			expect(Inner.prototype.componentWillUnmount, 'initial mount').not.to.have
				.been.called;

			Inner.prototype.componentWillMount.resetHistory();
			
			root.render(`<Outer child={InnerFunc} />`, { Outer: Outer, InnerFunc: InnerFunc });

			expect(Inner.prototype.componentWillMount, 'unmount').not.to.have.been
				.called;
			expect(Inner.prototype.componentWillUnmount, 'unmount').to.have.been
				.calledOnce;

			Inner.prototype.componentWillUnmount.resetHistory();
			
			root.render(`<Outer child={Inner} />`, { Outer: Outer, Inner: Inner });

			expect(Inner.prototype.componentWillMount, 'remount').to.have.been
				.calledOnce;
			expect(Inner.prototype.componentWillUnmount, 'remount').not.to.have.been
				.called;
		});
	});

	describe('Component Nesting', () =>
	{
		let useIntermediary = false;
		
		let createComponent = Intermediary =>
		{
			class C extends reactifly.Component
			{
				componentWillMount()
				{}
				
				render()
				{
					if (!useIntermediary) return this.props.children;
					
					Intermediary = useIntermediary === true ? Intermediary : useIntermediary;

					reactifly.bind('children', this.props.children);

	                reactifly.bind('Intermediary', Intermediary);

	                return `<Intermediary>{children}</Intermediary>`;
				}
			}

			sinon.spy(C.prototype, 'componentWillMount');
			sinon.spy(C.prototype, 'render');
			
			return C;
		};

		let createFunction = () => sinon.spy(({children}) => children);
        
		let F1 = createFunction();
		let F2 = createFunction();
		let F3 = createFunction();

		let C1 = createComponent(F1);
		let C2 = createComponent(F2);
		let C3 = createComponent(F3);

		let reset = () => 
		{
			[C1, C2, C3]
				.reduce(
					(acc, c) =>
						acc.concat(c.prototype.render, c.prototype.componentWillMount),
					[F1, F2, F3]
				)
				.forEach(c => c.resetHistory());
		}

		it('should handle lifecycle for no intermediary in component tree', () =>
		{
			reset();
			root.render(`
				<C1>
					<C2>
						<C3>C1 > C2 > C3 > Text</C3>
					</C2>
				</C1>
			`, {C1: C1, C2: C2, C3: C3 });

			expect(C1.prototype.componentWillMount, 'initial mount').to.have.been
				.calledOnce;
			expect(C2.prototype.componentWillMount, 'initial mount').to.have.been
				.calledOnce;
			expect(C3.prototype.componentWillMount, 'initial mount').to.have.been
				.calledOnce;

			reset();
			root.render(`
				<C1>
					<C2>C1 > C2 > Text</C2>
				</C1>
			`, {C1: C1, C2: C2, C3: C3 });

			expect(C1.prototype.componentWillMount, 'unmount innermost, C1').not.to
				.have.been.called;
			expect(C2.prototype.componentWillMount, 'unmount innermost, C2').not.to
				.have.been.called;

			reset();
			root.render(`
				<C1>
					<C3>C1 > C3 > Text</C3>
				</C1>
			`, {C1: C1, C2: C2, C3: C3 });

			expect(C1.prototype.componentWillMount, 'swap innermost').not.to.have.been
				.called;
			expect(C3.prototype.componentWillMount, 'swap innermost').to.have.been
				.calledOnce;

			reset();
			root.render(`
				<C1>
					<C2>
						<C3>C1 > C2 > Final Text</C3>
					</C2>
				</C1>
			`, {C1: C1, C2: C2, C3: C3 });

			expect(C1.prototype.componentWillMount, 'inject between, C1').not.to.have
				.been.called;
			expect(C2.prototype.componentWillMount, 'inject between, C2').to.have.been
				.calledOnce;
			expect(C3.prototype.componentWillMount, 'inject between, C3').to.have.been
				.calledOnce;
		});
	
		it('should handle lifecycle for nested intermediary functional components', () =>
		{
			useIntermediary = true;

			root.render(`<div />`);
			reset();
			root.render(`
				<C1>
					<C2>
						<C3>Some Text</C3>
					</C2>
				</C1>
			`, {C1: C1, C2: C2, C3: C3 });

			expect(
				C1.prototype.componentWillMount,
				'initial mount w/ intermediary fn, C1'
			).to.have.been.calledOnce;
			expect(
				C2.prototype.componentWillMount,
				'initial mount w/ intermediary fn, C2'
			).to.have.been.calledOnce;
			expect(
				C3.prototype.componentWillMount,
				'initial mount w/ intermediary fn, C3'
			).to.have.been.calledOnce;

			reset();
			root.render(`
				<C1>
					<C2>Some Text</C2>
				</C1>
			`, {C1: C1, C2: C2 });

			expect(
				C1.prototype.componentWillMount,
				'unmount innermost w/ intermediary fn, C1'
			).not.to.have.been.called;
			expect(
				C2.prototype.componentWillMount,
				'unmount innermost w/ intermediary fn, C2'
			).not.to.have.been.called;

			reset();
			root.render(`
				<C1>
					<C3>Some Text</C3>
				</C1>
			`, {C1: C1, C3: C3 });

			expect(
				C1.prototype.componentWillMount,
				'swap innermost w/ intermediary fn'
			).not.to.have.been.called;
			expect(
				C3.prototype.componentWillMount,
				'swap innermost w/ intermediary fn'
			).to.have.been.calledOnce;

			reset();
			root.render(`
				<C1>
					<C2>
						<C3>Some Text</C3>
					</C2>
				</C1>
			`, {C1: C1, C2: C2, C3: C3 });

			expect(
				C1.prototype.componentWillMount,
				'inject between, C1 w/ intermediary fn'
			).not.to.have.been.called;
			expect(
				C2.prototype.componentWillMount,
				'inject between, C2 w/ intermediary fn'
			).to.have.been.calledOnce;
			expect(
				C3.prototype.componentWillMount,
				'inject between, C3 w/ intermediary fn'
			).to.have.been.calledOnce;
		});

		it('should render components by depth', () =>
		{
			let spy = sinon.spy();
			let update;
			
			class Child extends reactifly.Component
			{
				constructor(props)
				{
					super(props);

					update = () =>
					{
						this.props.update();
					};
				}

				render()
				{
					spy();

					let items = [];
					
					for (let i = 0; i < this.props.items; i++) items.push(i);

					reactifly.bind('items', items);
					
					return `<div>{items.join(',')}</div>`;
				}
			}

			let i = 0;

			class Parent extends reactifly.Component
			{
				render()
				{
					++i;

					reactifly.bind('i', i);

					reactifly.bind('Child', Child);

					let _this = this;

					let updateFunc = function()
		            {
		                _this.setState({});
		            }

		            reactifly.bind('updateFunc', updateFunc);

					return `<Child items={i} update={() => this.setState({})} />`;
				}
			}

			root.render(`<Parent />`, {Parent : Parent});
			expect(spy).to.be.calledOnce;

			update();
			expect(spy).to.be.calledTwice;
		});

		it('should handle lifecycle for nested intermediary elements', () =>
		{
			useIntermediary = 'div';

			root.render(`<div />`);
			reset();
			root.render(`
				<C1>
					<C2>
						<C3>Some Text</C3>
					</C2>
				</C1>
			`, {C1: C1, C2: C2, C3: C3 });

			expect(
				C1.prototype.componentWillMount,
				'initial mount w/ intermediary div, C1'
			).to.have.been.calledOnce;
			expect(
				C2.prototype.componentWillMount,
				'initial mount w/ intermediary div, C2'
			).to.have.been.calledOnce;
			expect(
				C3.prototype.componentWillMount,
				'initial mount w/ intermediary div, C3'
			).to.have.been.calledOnce;

			reset();
			root.render(`
				<C1>
					<C2>Some Text</C2>
				</C1>,
			`, {C1: C1, C2: C2 });

			expect(
				C1.prototype.componentWillMount,
				'unmount innermost w/ intermediary div, C1'
			).not.to.have.been.called;
			expect(
				C2.prototype.componentWillMount,
				'unmount innermost w/ intermediary div, C2'
			).not.to.have.been.called;

			reset();
			root.render(`
				<C1>
					<C3>Some Text</C3>
				</C1>
			`, {C1: C1, C3: C3 });

			expect(
				C1.prototype.componentWillMount,
				'swap innermost w/ intermediary div'
			).not.to.have.been.called;
			expect(
				C3.prototype.componentWillMount,
				'swap innermost w/ intermediary div'
			).to.have.been.calledOnce;

			reset();
			root.render(`
				<C1>
					<C2>
						<C3>Some Text</C3>
					</C2>
				</C1>,
			`, {C1: C1, C2: C2, C3: C3 });

			expect(
				C1.prototype.componentWillMount,
				'inject between, C1 w/ intermediary div'
			).not.to.have.been.called;
			expect(
				C2.prototype.componentWillMount,
				'inject between, C2 w/ intermediary div'
			).to.have.been.calledOnce;
			expect(
				C3.prototype.componentWillMount,
				'inject between, C3 w/ intermediary div'
			).to.have.been.calledOnce;
		});

	});
	
	it('should handle hoisted component vnodes without DOM', () =>
	{
		let x = 0;
		let mounted = '';
		let unmounted = '';
		let updateAppState;

		class X extends reactifly.Component
		{
			constructor(props)
			{
				super(props);

				this.name = `${x++}`;
			}

			componentDidMount()
			{
				mounted += `,${this.name}`;
			}

			componentWillUnmount()
			{
				unmounted += `,${this.name}`;
			}

			render()
			{
				return null;
			}
		}

		// Statically create X element
		const A = reactifly.jsx(`<X />`, {X : X});

		class App extends reactifly.Component
		{
			A = A;

			constructor(props)
			{
				super(props);
				
				this.state = { i: 0 };

				updateAppState = () => this.setState({ i: this.state.i + 1 });
			}

			render()
			{
				return `
					<div key={this.state.i}>
						{A}
						{A}
					</div>
				`;
			}
		}

		root.render(App);

		updateAppState();
		updateAppState();

		/*expect(mounted).to.equal(',0,1,2,3,4,5');
		expect(unmounted).to.equal(',0,1,2,3');*/
	});

	describe('forceUpdate', () =>
	{
		it('should not error if called on an unmounted component', () =>
		{
			let forceUpdate;

			class Foo extends reactifly.Component
			{
				constructor(props)
				{
					super(props);

					forceUpdate = () => this.forceUpdate();
				}

				render()
				{
					return `<div>Hello</div>`;
				}
			}

			root.render(Foo);
			expect(scratch.innerHTML).to.equal('<div>Hello</div>');

			root.render(null);
			expect(scratch.innerHTML).to.equal('');

			expect(() => forceUpdate()).to.not.throw();
			expect(scratch.innerHTML).to.equal('');
		});

		it('should update old dom on forceUpdate in a lifecycle', () =>
		{
			let i = 0;
			
			class App extends reactifly.Component
			{
				componentWillReceiveProps()
				{
					this.forceUpdate();
				}
				render()
				{
					if (i++ == 0) return `<div>foo</div>`;
					return `<div>bar</div>`;
				}
			}

			root.render(App);
			root.render(App)

			expect(scratch.innerHTML).to.equal('<div>bar</div>');
		});

	});
});

