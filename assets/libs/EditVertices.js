define(['openlayers'], function(OpenLayers) {

  var EditVertices = OpenLayers.Class(OpenLayers.Control.ModifyFeature, {

    /**
     * Maps keycode to the action/state to set.  Keycodes not in this
     * map will be ignored.
     */
    keyCodeMap: {
      // special-cased; from the original behaviour:
      46: 'delete',
      68: 'delete',
      // These set the state appropriately:
      // 'i'
      73: 'internal',
      // 'e'
      69: 'external',
      // 'o'
      79: 'origin',
      // 'x' ("remove"; resets status to default)
      88: 'default'
    },

    /**
     * Method: handleKeypress
     * Called by the feature handler on keypress.  In the original
     *     implementation this is used to delete vertices; we
     *     over-ride it here to add other PLUM-derived handlers to
     *     also set attributes on the feature. If the <deleteCode>
     *     property is set, vertices will be deleted when a feature is
     *     selected for modification and the mouse is over a vertex.
     *
     * Parameters:
     * evt - {Event} Keypress event.
     */
    handleKeypress: function(evt) {
      var code = evt.keyCode;

      // check for delete key
      if(this.feature &&
         this.keyCodeMap[code]) {
        var vertex = this.layer.getFeatureFromEvent(this.handlers.drag.evt);
        if (!vertex) return;

        // Only want to handle key-presses for the vertices:
        if (vertex.geometry.CLASS_NAME !== 'OpenLayers.Geometry.Point') return;

        var action = this.keyCodeMap[code];
        if (action === 'delete' &&
            OpenLayers.Util.indexOf(this.vertices, vertex) != -1 &&
            !this.handlers.drag.dragging && vertex.geometry.parent) {
          // remove the vertex
          vertex.geometry.parent.removeComponent(vertex.geometry);
          this.layer.events.triggerEvent("vertexremoved", {
            vertex: vertex.geometry,
            feature: this.feature,
            pixel: evt.xy
          });
          this.layer.drawFeature(this.feature, this.standalone ?
                                 undefined : 'select');
          this.modified = true;
          this.resetVertices();
          this.setFeatureState();
          this.onModification(this.feature);
        }
        else {
          // Patch state onto the geometry object.  It probably is
          // more idiomatic to use the .attributes property of the
          // vertex, which is for arbitrary data, this gets nuked
          // every time we resetVertices().  So, use the geometry
          // object underneath, which doesn't get altered (note, it
          // doesn't get cloned either.  The implementation creates
          // "virtual" features that share the underlying geometries).
          // If this code suddenly breaks, it could be because you've
          // upgraded openlayers and this assumption suddenly no
          // longer holds..
          vertex.geometry._state = action;
          this.layer.drawFeature(vertex, 'editing');
        }
        this.layer.events.triggerEvent("featuremodified",
                                       {feature: this.feature});
      }
    }

  });

  return EditVertices;

});
