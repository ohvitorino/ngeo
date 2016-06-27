goog.provide('ngeo.format.XSDAttribute');

goog.require('ol.format.XML');


/**
 * @classdesc
 * Reads attributes that are defined in XSD format and return them as a list.
 *
 * @constructor
 * @extends {ol.format.XML}
 * @export
 */
ngeo.format.XSDAttribute = function() {
  goog.base(this);
};
goog.inherits(ngeo.format.XSDAttribute, ol.format.XML);


/**
 * @param {Document|Node|string} source Source.
 * @return {Array.<ngeox.Attribute>} The parsed result.
 */
ngeo.format.XSDAttribute.prototype.read = function(source) {
  return /** @type {Array.<ngeox.Attribute>} */ (
    goog.base(this, 'read', source)
  );
};


/**
 * @param {Document} doc Document.
 * @return {Array.<ngeox.Attribute>} List of attributes.
 */
ngeo.format.XSDAttribute.prototype.readFromDocument = function(doc) {
  goog.asserts.assert(doc.nodeType == goog.dom.NodeType.DOCUMENT,
      'doc.nodeType should be DOCUMENT');
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return this.readFromNode(n);
    }
  }
  return null;
};


/**
 * @param {Node} node Node.
 * @return {Array.<ngeox.Attribute>} List of attributes.
 */
ngeo.format.XSDAttribute.prototype.readFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'schema',
      'localName should be schema');

  var elements = node.getElementsByTagName('element');
  var attributes = [];

  var attribute;
  for (var i = 0, ii = elements.length; i < ii; i++) {
    attribute = this.readFromElementNode_(elements[i]);
    if (attribute) {
      attributes.push(attribute);
    }
  }

  return attributes;
};


/**
 * @param {Node} node Node.
 * @return {?ngeox.Attribute} An attribute object.
 * @private
 */
ngeo.format.XSDAttribute.prototype.readFromElementNode_ = function(node) {

  var name = node.getAttribute('name');
  goog.asserts.assert(name, 'name should be defined in element node.');

  var nillable = node.getAttribute('nillable');
  var required = !(nillable === true || nillable === 'true');

  var attribute = {
    name: name,
    required: required
  };

  var type = node.getAttribute('type');
  if (type) {
    // Skip attribute of any 'geometry' type
    var geomRegex =
      /gml:((Multi)?(Point|Line|Polygon|Curve|Surface|Geometry)).*/;
    if (geomRegex.exec(type)) {
      return null;
    }

    if (type === 'xsd:string') {
      attribute.type = ngeo.format.XSDAttributeType.TEXT;
    } else if (type === 'xsd:date') {
      attribute.type = ngeo.format.XSDAttributeType.DATE;
    } else if (type === 'xsd:dateTime') {
      attribute.type = ngeo.format.XSDAttributeType.DATETIME;
    } else {
      return null;
    }
  } else {
    var enumerations = node.getElementsByTagName('enumeration');
    if (enumerations.length) {
      attribute.type = ngeo.format.XSDAttributeType.SELECT;
      var choices = [];
      for (var i = 0, ii = enumerations.length; i < ii; i++) {
        choices.push(enumerations[i].getAttribute('value'));
      }
      attribute.choices = choices;
    } else {
      return null;
    }
  }

  goog.asserts.assert(attribute.type);

  return attribute;
};


/**
 * @enum {string}
 */
ngeo.format.XSDAttributeType = {
  /**
   * @type {string}
   */
  DATE: 'date',
  /**
   * @type {string}
   */
  DATETIME: 'datetime',
  /**
   * @type {string}
   */
  SELECT: 'select' ,
  /**
   * @type {string}
   */
  TEXT: 'text'
};