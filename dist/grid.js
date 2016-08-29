'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodash = require('lodash');

var _item = require('./item');

var _item2 = _interopRequireDefault(_item);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var InfiniteGrid = function (_React$Component) {
	_inherits(InfiniteGrid, _React$Component);

	_createClass(InfiniteGrid, [{
		key: 'initialState',
		value: function initialState() {
			return {
				initiatedLazyload: false,
				minHeight: window.innerHeight * 2,
				minItemIndex: 0,
				maxItemIndex: 100,
				itemDimensions: {
					height: this._itemHeight(),
					width: this._itemHeight(),
					gridWidth: 0,
					itemsPerRow: 2
				}
			};
		}
	}], [{
		key: 'propTypes',
		get: function get() {
			return {
				itemClassName: _react2.default.PropTypes.string,
				entries: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.object).isRequired,
				height: _react2.default.PropTypes.number,
				width: _react2.default.PropTypes.number,
				padding: _react2.default.PropTypes.number,
				wrapperHeight: _react2.default.PropTypes.number,
				lazyCallback: _react2.default.PropTypes.func,
				renderRangeCallback: _react2.default.PropTypes.func,
				buffer: _react2.default.PropTypes.number,
				gridStyle: _react2.default.PropTypes.object,
				shouldComponentUpdate: _react2.default.PropTypes.func,
				itemWrapper: _react2.default.PropTypes.func // function to wrap Item components (for use with MobX), defaults to returning the component itself
			};
		}
	}]);

	function InfiniteGrid(props) {
		_classCallCheck(this, InfiniteGrid);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(InfiniteGrid).call(this, props));

		_this.state = _this.initialState();
		// bind the functions
		_this._scrollListener = _this._scrollListener.bind(_this);
		_this._updateItemDimensions = _this._updateItemDimensions.bind(_this);
		_this._resizeListener = _this._resizeListener.bind(_this);
		_this._visibleIndexes = _this._visibleIndexes.bind(_this);
		return _this;
	}

	// METHODS

	_createClass(InfiniteGrid, [{
		key: '_wrapperStyle',
		value: function _wrapperStyle() {
			return {
				maxHeight: this._getGridHeight(),
				overflowY: 'scroll',
				width: '100%',
				height: this.props.wrapperHeight,
				WebkitOverflowScrolling: 'touch'
			};
		}
	}, {
		key: '_gridStyle',
		value: function _gridStyle() {
			return _.merge({
				position: 'relative',
				marginTop: this.props.padding,
				marginLeft: this.props.padding,
				minHeight: this._getGridHeight(),
				minWidth: '100%'
			}, this.props.gridStyle);
		}
	}, {
		key: '_getGridRect',
		value: function _getGridRect() {
			return this.refs.grid.getBoundingClientRect();
		}
	}, {
		key: '_getGridHeight',
		value: function _getGridHeight() {
			var gridRow = Math.floor(this.props.entries.length / this.state.itemDimensions.itemsPerRow);
			return this.props.entries.length < this.state.itemDimensions.itemsPerRow ? this.state.itemDimensions.height : gridRow > 2 ? gridRow * this.state.itemDimensions.height : 3 * this.state.itemDimensions.height;
		}
	}, {
		key: '_getWrapperRect',
		value: function _getWrapperRect() {
			return this.refs.wrapper.getBoundingClientRect();
		}
	}, {
		key: '_visibleIndexes',
		value: function _visibleIndexes() {
			var itemsPerRow = this._itemsPerRow();

			// The number of rows that the user has scrolled past
			var scrolledPast = this._scrolledPastRows() * itemsPerRow;
			if (this._isNegative(scrolledPast)) scrolledPast = 0;

			// If i have scrolled past 20 items, but 60 are visible on screen,
			// we do not want to change the minimum
			var min = scrolledPast - itemsPerRow;
			if (this._isNegative(min)) min = 0;

			// the maximum should be the number of items scrolled past, plus some
			// buffer
			var bufferRows = this._numVisibleRows() + this.props.buffer;
			var max = scrolledPast + itemsPerRow * bufferRows;
			if (max > this.props.entries.length) max = this.props.entries.length;

			this.setState({
				minItemIndex: min,
				maxItemIndex: max
			}, function () {
				this._lazyCallback();
			});
		}
	}, {
		key: '_updateItemDimensions',
		value: function _updateItemDimensions() {
			this.setState({
				itemDimensions: {
					height: this._itemHeight(),
					width: this._itemHeight(),
					gridWidth: this._getGridRect().width,
					itemsPerRow: this._itemsPerRow()
				},
				minHeight: this._totalRows()
			});
		}
	}, {
		key: '_itemsPerRow',
		value: function _itemsPerRow() {
			var itemsPerRow = Math.floor(this._getGridRect().width / this._itemWidth());
			if (itemsPerRow === 0) return 1;
			return itemsPerRow;
		}
	}, {
		key: '_totalRows',
		value: function _totalRows() {
			var scrolledPastHeight = this.props.entries.length / this._itemsPerRow() * this._itemHeight();
			if (this._isNegative(scrolledPastHeight)) return 0;
			return scrolledPastHeight;
		}
	}, {
		key: '_scrolledPastRows',
		value: function _scrolledPastRows() {
			var rect = this._getGridRect();
			var topScrollOffset = rect.height - rect.bottom;
			return Math.floor(topScrollOffset / this._itemHeight());
		}
	}, {
		key: '_itemHeight',
		value: function _itemHeight() {
			return this.props.height + 2 * this.props.padding;
		}
	}, {
		key: '_itemWidth',
		value: function _itemWidth() {
			return this.props.width + 2 * this.props.padding;
		}
	}, {
		key: '_numVisibleRows',
		value: function _numVisibleRows() {
			return Math.ceil(this._getWrapperRect().height / this._itemHeight());
		}
	}, {
		key: '_lazyCallback',
		value: function _lazyCallback() {
			if (!this.state.initiatedLazyload && this.state.maxItemIndex === this.props.entries.length && this.props.lazyCallback) {
				this.setState({ initiatedLazyload: true });
				this.props.lazyCallback(this.state.maxItemIndex);
			}
		}
	}, {
		key: '_isNegative',
		value: function _isNegative(n) {
			return ((n = +n) || 1 / n) < 0;
		}

		// LIFECYCLE

	}, {
		key: 'componentWillMount',
		value: function componentWillMount() {
			window.addEventListener('resize', this._resizeListener);
		}
	}, {
		key: 'componentDidMount',
		value: function componentDidMount() {
			this._updateItemDimensions();
			this._visibleIndexes();
		}
	}, {
		key: 'componentWillReceiveProps',
		value: function componentWillReceiveProps(nextProps) {
			if (nextProps.entries.length > this.props.entries.length) {
				this.setState({
					initiatedLazyload: false
				});
			}
			// Update these all the time because entries may change on the fly.
			this._updateItemDimensions();
			this._visibleIndexes();
		}
	}, {
		key: 'componentDidUpdate',
		value: function componentDidUpdate(prevProps, prevState) {
			if (typeof this.props.renderRangeCallback === 'function') {
				this.props.renderRangeCallback(this.state.minItemIndex, this.state.maxItemIndex);
			}
		}
	}, {
		key: 'shouldComponentUpdate',
		value: function shouldComponentUpdate(nextProps, nextState) {
			if (this.props.shouldComponentUpdate) {
				return this.props.shouldComponentUpdate.call(this, nextProps, nextState);
			}
			// or...
			return true;
		}
	}, {
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			window.removeEventListener('resize', this._resizeListener);
		}

		// LISTENERS

	}, {
		key: '_scrollListener',
		value: function _scrollListener(event) {
			var _this2 = this;

			clearTimeout(this.scrollOffset);
			this.scrollOffset = setTimeout(function () {
				_this2._visibleIndexes();
			}, 10);
		}
	}, {
		key: '_resizeListener',
		value: function _resizeListener(event) {
			if (!this.props.wrapperHeight) {
				this.setState({
					wrapperHeight: window.innerHeight
				});
			}
			this._updateItemDimensions();
			this._visibleIndexes();
		}

		// RENDER

	}, {
		key: 'render',
		value: function render() {
			var entries = [];

			// if no entries exist, there's nothing left to do
			if (!this.props.entries.length) {
				return null;
			}

			var Item = this.props.itemWrapper(_item2.default); // wrap the Item function in whatever we want to wrap it in (eg decorator)

			for (var i = this.state.minItemIndex; i <= this.state.maxItemIndex; i++) {
				var entry = this.props.entries[i];
				if (!entry) {
					continue;
				}
				var itemProps = {
					key: 'item-' + i,
					index: i,
					padding: this.props.padding,
					dimensions: this.state.itemDimensions,
					data: entry
				};
				entries.push(_react2.default.createElement(Item, itemProps));
			}
			return _react2.default.createElement(
				'div',
				{ className: 'infinite-grid-wrapper', ref: 'wrapper', onScroll: this._scrollListener, style: this._wrapperStyle() },
				_react2.default.createElement(
					'div',
					{ ref: 'grid', className: 'infinite-grid', style: this._gridStyle() },
					entries
				)
			);
		}
	}]);

	return InfiniteGrid;
}(_react2.default.Component);

exports.default = InfiniteGrid;
;

InfiniteGrid.defaultProps = {
	buffer: 10,
	padding: 10,
	entries: [],
	height: 250,
	width: 250,
	gridStyle: {},
	shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
		return !(0, _lodash.isEqual)(this.state, nextState);
	},
	itemWrapper: function itemWrapper(C) {
		return C;
	} // default to just returning the component
};