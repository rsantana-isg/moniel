const fs = require("fs")
const ohm = require("ohm-js")

class Parser{
	contents = null
	grammar = null
	
	evalOperation = {
		Graph: (definitions) =>  ({
			kind: "Graph",
			definitions: definitions.eval()
		}),
		NodeDefinition: function(_, layerName, params, body) {
			return {
				kind: "NodeDefinition",
				name: layerName.source.contents,
				body: body.eval()[0]
			}
		},
		InlineMetanode: function(name, body) {
			return {
				kind: "InlineMetanode",
				name: name.eval()[0],
				body: body.eval(),
				_source: this.source
			}
		},
		Metanode: function(_, defs, __) {
			var definitions = defs.eval()
			return {
				kind: "MetaNode",
				definitions: definitions.definitions
			}
		},
		Chain: function(list) {
			return {
				kind: "Chain",
				blocks: list.eval()
			}
		},
		Node: function(id, layerName, params) {
			return {
				kind: "Node",
				name: layerName.eval(),
				alias: id.eval()[0],
				parameters: params.eval(),
				_source: this.source
			}
		},
		BlockName: function(id, _) {
			return id.eval()
		},
		List: function(_, list, __) {
			return {
				kind: "List",
				list: list.eval()
			}
		},
		BlockParameters: function(_, list, __) {
			return list.eval()
		},
		Parameter: function(name, _, value) {
			return {
				kind: "Parameter",
				name: name.eval(),
				value: value.eval()
			}
		},
		Value: function(val) {
			return {
				kind: "Value",
				value: val.source.contents
			}
		},
		NonemptyListOf: function(x, _, xs) {
			return [x.eval()].concat(xs.eval())
		},
		EmptyListOf: function() {
			return []
		},
		path: function(list) {
			return {
				kind: "Identifier",
				value: this.source.contents,
				_source: this.source
			}
		},
		parameterName: function(a) {
			return a.source.contents
		},
		nodeType: function(_, __) {
			return {
				kind: "NodeType",
				value: this.source.contents,
				_source: this.source
			}
		},
		identifier: function(_, __) {
			return {
				kind: "Identifier",
				value: this.source.contents,
				_source: this.source
			}
		}
	}

	constructor() {
		this.contents = fs.readFileSync("src/moniel.ohm", "utf8")
		this.grammar = ohm.grammar(this.contents)
		this.semantics = this.grammar.createSemantics().addOperation("eval", this.evalOperation)
	}

	make(source) {
		var result = this.grammar.match(source)

		if (result.succeeded()) {
			var ast = this.semantics(result).eval()
			return {
				ast
			}
		} else {
			var expected = result.getExpectedText()
			var position = result.getRightmostFailurePosition()
			return {
				expected,
				position
			}
		}
	}

}