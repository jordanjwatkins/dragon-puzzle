jQuery(function($) {	
	var puzzle  = function ( ) {
		return{
			rows: 4,
			cols: 4,
			pieceCount: 16,
			isComplete: 0,
			initializePieces: function  (allConnectors) {
				var allPieces = new Array();
				for(var i = 1; i <= this.pieceCount; i++){
					var thePiece = allPieces['piece' + i] = piece(i, allConnectors['connectors_' + i], this);
					var position = $('#piece' + i).position();
					thePiece.updatePosition(position.top, position.left);
					thePiece.makeDraggable();				
				};					
				return allPieces;
			},
			newParent: function ( ) {
				this.pieceCount += 1;
				return this.pieceCount;
			},
			createConnectors: function (connector) {
				var allConnectors = new Array();
				for(var piece = 1; piece <= this.pieceCount; piece++) {
					//init connectors objects
					allConnectors['connectors_' + piece] = {};
					var id = piece * 4 - 3;
					for(var side = 1; side <= 4; side++) {
						var c =  connector(id, side, this);
						if (c !== undefined) {
							allConnectors['connectors_' + piece]['c' + id] = c;
						}						
						id++;
					}
				}
				return allConnectors;
			},
			isCompleteCheck: function () {
				for(connectors in allConnectors){
					var theConnectors = allConnectors[connectors];
					for(connector in theConnectors){
						var connector = allConnectors[connectors][connector];
						if (connector.isActive === 1) {return false;}
					}
				}
				this.isComplete = true;
				return true;
			}
		};	
	};
	
	var piece = function (id, connectors, isParent, puzzle) {
		if (isParent === 1) {
			$('#puzzle').append("<div id='piece" + id + "' class='piece parent'></div>");
		}else{
			$('#puzzle').append("<div id='piece" + id + "' class='piece child'><div class='piece-image'></div><div class='shadow'></div></div>");
		}		
		if(!isParent){var isParent = 0;}		
		return {
			id: id,
			width: 99,
			height: 99,
			isParent: isParent,
			isChild: 0,
			parent: null,
			childPieces: new Array(),
			position: new Array(),
			absTop: 0,
			absLeft: 0,
			top: 0, 
			left: 0,
			right: 0,
			centerX: 0,
			centerY: 0,
			relTop: 0,
			relLeft: 0,
			type: null,
			connectors: connectors,
			matchCheck: function (firstParent) {
				var aMatch = null;
				var connectorCount = 0;
				var matches = {};
				var theFirstParent = firstParent;
				//check pieces connectors for matches
				for(connector in this.connectors) {					
					connectorCount += 1;
					var c = allConnectors['connectors_' + this.id][connector];
					if (c.isActive === 1) {
						var p1 = c.position();					
						var partner = allConnectors['connectors_' + c.partner['piece']]['c' + c.partner['id']];
						var p2 = partner.position();
						var xAlign = (p2.x - 5) < p1.x && p1.x < (p2.x + 5);
						var yAlign = (p2.y - 5) < p1.y && p1.y < (p2.y + 5);
						//deactivate matched connectors and add them to matches array
						if (xAlign && yAlign){
							aMatch = 1;
							c.isActive = 0;
							partner.isActive = 0;
							matches[connectorCount] = {'c':c, 'partner': partner};
						}																					
					}
				}				
				if (aMatch !== null) {
					//check for initial match
					var count = 0;
					var pieceOne = 0;
					var firstPartner = null;
					var firstPartnerParent = null;
					var theParent = 0;
					for (var match in matches) {
						var theMatch = matches[match];
						var piece1 = allPieces['piece' + theMatch.c.piece];
						var piece2 = allPieces['piece' + theMatch.partner.piece];
						if (count < 1) {
							pieceOne = piece1.id;
							firstPartner = piece2.id;
							firstPartnerParent = piece2.parent;
						}
						//skip connecting if already matched with partner parent					
						if (piece1.parent !== null) {					
							if (count === 0 && piece1.parent <= theFirstParent) {
								pieceOne = piece1.id;
								theParent = piece1.parent;
								this.connectPieces(theMatch['c'], theMatch['partner']);					
							} else {								
								if (piece1.parent === piece2.parent || piece1.parent >= theFirstParent) {
									continue;
									
								} else {
									this.connectPieces(theMatch['c'], theMatch['partner']);
								}
							}																
						
						} else {
								this.connectPieces(theMatch['c'], theMatch['partner']);						
						}
						count++;												
					}
				}else{
					//check children for matches
					if (this.isParent === 1) {
						var childMatchCount = 0;
						var firstParent = null;
						for(var childPiece in this.childPieces){
							childPiece = this.childPieces[childPiece];
							if(childPiece !== undefined){
								var pieceName = 'piece' + this.childPieces[childPiece];
								var piece = allPieces['piece' +childPiece];	
								
								if(childMatchCount === 0) {
									firstParent = piece.parent;									
								}
								if(piece.matchCheck(firstParent) === 1){
									aMatch = 2;
									childMatchCount++;
								}
							}
						}
					}
				}
				return aMatch;	
			},			
			updatePosition: function(top, left) {
				var height = this.height;
				var width = this.width;
				this.absTop = top;
				this.absLeft = left;
				this.absBottom = top + height;
				this.absRight = left + width;
				this.left = left + width/6;
				this.right = left + width - width/6;
				this.centerY = left + width/2;
				this.centerX = top + height/2;
				this.bottom = top + height - height/6;
				this.top = top + height/6;
				for (connector in connectors) {
					connectors[connector].update(this);
				}				
				//update child positions
				if(this.isParent === 1){
					for(var childPiece in this.childPieces){
						var childPiece = this.childPieces[childPiece];
						if(childPiece !== undefined){							
							var piece = allPieces['piece' + childPiece];
							var childTop = this.absTop + piece.relTop;
							var childLeft = this.absLeft + piece.relLeft;
							piece.updatePosition(childTop,childLeft);
						}
					}
				}			
			},
			makeDraggable: function () {
				$("#piece"+this.id).draggable({
					start: function(event, ui){
						var piece = allPieces[$(this).attr('id')];
						$('#piece'+piece.id).css('zIndex', 1000).addClass('shadow');//add shadow								
					},
					drag: function(event, ui){},
					stop: function(event, ui){
						$(this).removeClass('shadow');//remove shadow
						var piece = allPieces[$(this).attr('id')];
						var position = $(this).position();
						piece.updatePosition(position.top, position.left);	//update piece position					
						piece.matchCheck();		
						if(piece.id > 16){
							$('#piece'+piece.id).css('zIndex', 0).removeClass('shadow');//remove shadow;
						}else{
							$('#piece'+piece.id).css('zIndex', 1).removeClass('shadow');//remove shadow
						
						}
						if(!thePuzzle.isComplete && thePuzzle.isCompleteCheck()){
							$('#piece' + thePuzzle.pieceCount).append("<div id='complete'></div>").addClass('complete');
						}
					}				
				});
			},
			connectPieces: function (c, partner) {	
				//get the piece for each connector		
				var piece1 = allPieces['piece' + c.piece];
				var piece2 = allPieces['piece' + partner.piece];
				//if pieces are children use parents instead
				if(piece1.isChild === 1){
					var piece1 = allPieces['piece' + piece1.parent];			
				}
				if(piece2.isChild === 1){
					var piece2 = allPieces['piece' + piece2.parent];			
				}
				//find alignment adjustment distance
				var adjX = piece1.absLeft + partner.x - c.x;
				var adjY = piece1.absTop + partner.y - c.y;
				$('#piece' + piece1.id).attr('style', 'top: ' + adjY + 'px; left: ' + adjX + 'px;');
				var position = $('#piece' + piece1.id).position();
				piece1.updatePosition(position.top, position.left);
				position = $('#piece' + piece2.id).position();		
				piece2.updatePosition(position.top, position.left);
							
				//determine corners of parent piece
				var parentTop = 0;
				var parentLeft = 0;
				var parentBottom = 0;
				var parentRight = 0;
				var parentWidth = 0;
				var parentHeight = 0;
				
				if(piece1.absTop < piece2.absTop){parentTop = piece1.absTop;}else{parentTop = piece2.absTop;}
				if(piece1.absLeft < piece2.absLeft){parentLeft = piece1.absLeft;}else{parentLeft = piece2.absLeft;}
				if(piece1.absBottom > piece2.absBottom){parentBottom = piece1.absBottom;}else{parentBottom = piece2.absBottom;}
				if(piece1.absRight > piece2.absRight){parentRight = piece1.absRight;}else{parentRight = piece2.absRight;}
				parentHeight = parentBottom - parentTop;
				parentWidth = parentRight - parentLeft;
				
				//compare parent position with each child's position to get a relative child position
				piece1.relTop = piece1.absTop - parentTop;
				piece1.relLeft = piece1.absLeft - parentLeft;
				piece2.relTop = piece2.absTop - parentTop;
				piece2.relLeft = piece2.absLeft - parentLeft;
				
				//create parent piece
				var parentID = thePuzzle.newParent();		
				var newPiece = allPieces['piece' + parentID] = piece(parentID, null, 1);
				newPiece.height = parentHeight;
				newPiece.width = parentWidth;
				$('#piece' + parentID).attr('style', 'top: ' + parentTop + 'px;left:' + parentLeft + 'px;width:' + parentWidth + 'px;height:' + parentHeight + 'px; z-index: 0;');
				$('#piece' + piece1.id + ', #piece' + piece2.id).appendTo('#piece' + parentID).draggable('destroy');
				$('#piece' + piece1.id).attr('style', 'top: ' + piece1.relTop + 'px;left:' + piece1.relLeft + 'px;');
				$('#piece' + piece2.id).attr('style', 'top: ' + piece2.relTop + 'px;left:' + piece2.relLeft + 'px;');
				//if new children are parents use their children instead
				if(piece1.isParent === 1){
					for(var childPiece in piece1.childPieces){
						childPiece = allPieces['piece' + piece1.childPieces[childPiece]];				
						$('#piece' + childPiece.id).appendTo('#piece' + newPiece.id);
						newPiece.childPieces.push(childPiece.id);
						childPiece.relTop = piece1.relTop + childPiece.relTop;
						childPiece.relLeft = piece1.relLeft + childPiece.relLeft;
						$('#piece' + childPiece.id).attr('style', 'top: ' + childPiece.relTop + 'px;left:' + childPiece.relLeft + 'px;');
						childPiece.isChild = 1;
						childPiece.parent = newPiece.id;
					}
					$('#piece' + piece1.id).remove();
					$('#piece' + piece1.id + '-data').remove();
				}else{
					newPiece.childPieces.push(piece1.id);
					piece1.isChild = 1;
					piece1.parent = newPiece.id;
				}
				if(piece2.isParent === 1){
					for(var childPiece in piece2.childPieces){
						childPiece = allPieces['piece' + piece2.childPieces[childPiece]];
						$('#piece' + childPiece.id).appendTo('#piece' + newPiece.id);
						newPiece.childPieces.push(childPiece.id);
						childPiece.relTop = piece2.relTop + childPiece.relTop;
						childPiece.relLeft =  piece2.relLeft + childPiece.relLeft;//				
						$('#piece' + childPiece.id).attr('style', 'top: ' + childPiece.relTop + 'px;left:' + childPiece.relLeft + 'px;');
						childPiece.isChild = 1;
						childPiece.parent = newPiece.id;
					}
					$('#piece' + piece2.id).remove();
					$('#piece' + piece2.id + '-data').remove();
				}else{
					newPiece.childPieces.push(piece2.id);
					piece2.isChild = 1;
					piece2.parent = newPiece.id;
				}
				
				newPiece.updatePosition(parentTop, parentLeft);
				newPiece.makeDraggable();					
			}
		};		
	};
						
	var connector = function (id, type, puzzle) {
		var skip = 0;
		var starters = new Array();
		var enders = new Array();
		for (var i = 0; i < puzzle.rows; i++) {			
			starters[i] = 1 + puzzle.cols*(i);
		}
		for (var i = 0; i < puzzle.rows; i++) {			
			enders[i] = puzzle.cols + puzzle.cols*(i);
		}		
		var piece = Math.ceil(id / 4);
		var partner = new Array();
		if (type === 2) {
			for (var ender in enders){
				if (enders[ender] === piece) {
					skip = 1;
				}
			}
			partner['id'] = id + 6;
		} else if (type === 4) {
			for (var starter in starters){
				if (starters[starter] === piece) {
					skip = 1;
				}
			}
			partner['id'] = id - 6;
		} else if (type === 1) {
			if(piece <= puzzle.cols){skip = 1;}
				partner['id'] = -(puzzle.cols * 4 - id - 2);			
		} else if (type === 3){
			if(piece > puzzle.cols * (puzzle.rows - 1)){skip = 1;}
			partner['id'] = puzzle.cols * 4 + id - 2;
		}
		partner['piece'] = Math.ceil(partner['id'] / 4);
		if(skip === 0){
			return{
				id: id,
				piece: piece,
				isActive: 1,
				type: type,// 1-top, 2-right, 3-bottom, 4-left
				x: null,
				y: null,
				partner: partner,
				update: function (piece) {
					if(this.type == 1){this.x = piece.centerY; this.y = piece.top;}
					if(this.type == 3){this.x = piece.centerY; this.y = piece.bottom;}
					if(this.type == 2){this.x = piece.right; this.y = piece.centerX;}
					if(this.type == 4){this.x = piece.left; this.y = piece.centerX;}			
				},
				position: function ( ) {
					var position = new Array();
					position.x = this.x;
					position.y = this.y;
					return position;
				}
			};
		}
	};
	
	var thePuzzle = puzzle();
	var allConnectors = thePuzzle.createConnectors(connector);
	var allPieces = thePuzzle.initializePieces(allConnectors);		
});