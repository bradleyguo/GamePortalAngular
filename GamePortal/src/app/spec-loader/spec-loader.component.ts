///<reference path="../../../node_modules/@angular/core/src/metadata/directives.d.ts"/>
import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {SpecService} from '../services/spec.service';
import {AngularFireDatabase} from 'angularfire2/database';

@Component({
  selector: 'app-spec-loader',
  templateUrl: './spec-loader.component.html',
  styleUrls: ['./spec-loader.component.css']
})
export class SpecLoaderComponent implements OnInit, OnChanges {
  @Input() spec: any;
  @Input() matchRef: any;
  board: any;
  pieces: any;
  constructor(private specService: SpecService, private af: AngularFireDatabase) { }

  loadSpec() {
    this.loadBoard();
    this.loadPieces();
  }

  loadBoard() {
    const imageId = this.spec.board.imageId;
    const imageRef = this.af.database.ref('gameBuilder/images/' + imageId);
    imageRef.once('value').then(snapshot => {
      this.board = {
        src: snapshot.val().downloadURL,
        height: snapshot.val().height,
        width: snapshot.val().width
      };
    });
  }

  loadPieces() {
    const pieceSpecs = this.spec.pieces;
    const allPieces = [];
    const numPieces = pieceSpecs.length;

    for (const piece of pieceSpecs) {
      // this new piece contains all the info we wanna have!
      const newpiece = {
        x: piece.initialState.x,
        y: piece.initialState.y,
        zDepth: piece.initialState.zDepth,
        draggable: null,
        kind: null,
        height: null,
        width: null,
        urls: []
      };
      const elemRef = this.af.database.ref('gameBuilder/elements/' + piece.pieceElementId);
      elemRef.once('value').then(snapshot => {
        newpiece.draggable = snapshot.val().isDraggable;
        newpiece.kind = snapshot.val().elementKind;
        newpiece.height = snapshot.val().height;
        newpiece.width = snapshot.val().width;
        const images = snapshot.val().images;
        const numImages = images.length;
        images.forEach((image) => {
          const imageRef = this.af.database.ref('gameBuilder/images/' + image.imageId);
          imageRef.once('value').then(imageInfo => {
            const url = imageInfo.val().downloadURL;
            newpiece.urls.push(url);
            if (newpiece.urls.length === numImages) {
              allPieces.push(newpiece);
              if (allPieces.length === numPieces) {
                this.pieces = allPieces;
              }
            }
          });
        });
      });
    }
  }
  // I think when spec changes, this.loadSpec would automatically be called again.
  ngOnInit() {
    this.loadSpec(); // the original version is loadSpec(this.spec);
  }

  ngOnChanges() {
    this.loadSpec();
  }
}
