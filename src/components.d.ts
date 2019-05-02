/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */


import '@stencil/core';




export namespace Components {

  interface FronwebComponent {}
  interface FronwebComponentAttributes extends StencilHTMLAttributes {}
}

declare global {
  interface StencilElementInterfaces {
    'FronwebComponent': Components.FronwebComponent;
  }

  interface StencilIntrinsicElements {
    'fronweb-component': Components.FronwebComponentAttributes;
  }


  interface HTMLFronwebComponentElement extends Components.FronwebComponent, HTMLStencilElement {}
  var HTMLFronwebComponentElement: {
    prototype: HTMLFronwebComponentElement;
    new (): HTMLFronwebComponentElement;
  };

  interface HTMLElementTagNameMap {
    'fronweb-component': HTMLFronwebComponentElement
  }

  interface ElementTagNameMap {
    'fronweb-component': HTMLFronwebComponentElement;
  }


  export namespace JSX {
    export interface Element {}
    export interface IntrinsicElements extends StencilIntrinsicElements {
      [tagName: string]: any;
    }
  }
  export interface HTMLAttributes extends StencilHTMLAttributes {}

}
