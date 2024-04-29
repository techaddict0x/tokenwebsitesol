window.eae = {};
window.renderIconHtml = function(view,elementor,sett,control_name, wClass = '', index=''){
    // console.log("View => ", view);
    // data.addRenderAttribute('key', 'context', 'value');
    // console.log(data.getRenderAttributeString('key'));

    var icon_class = '';
    let imageHtml = '';
    let lottie_data = [];
    let iconHtml = '';
    if(sett[control_name+'_graphic_type'] != 'none' && sett[control_name+'_graphic_type'] != ''){
        icon_class += ' eae-gbl-icon eae-graphic-type-'+ sett[control_name+'_graphic_type'] + ' elementor-animation-' + sett[control_name+'_hover_animation'];
        if(wClass != ''){
            icon_class += ' '+wClass;     
        }

        icon_class += ' eae-graphic-view-'+sett[control_name+'_view']; 
        if(sett[control_name+'_view'] != 'default'){
            icon_class += ' eae-graphic-shape-'+sett[control_name+'_shape'];
        }

        if(sett[control_name+'_graphic_type'] == 'lottie'){
            if( (sett[control_name+'_lottie_animation_url'] != '' ) ||  (sett[control_name+'_source_json']['url'] != '') ) {
                icon_class += ' eae-lottie-animation eae-lottie';
                lottie_data = {
                    'loop' : ( sett[control_name+'_lottie_animation_loop'] === 'yes' ) ? true : false,
                    'reverse' : ( sett[control_name+'_lottie_animation_reverse'] === 'yes' ) ? true : false,
                } 
                if(sett[control_name+'_source'] == 'media_file' && (sett[control_name+'_source_json']['url'] != '')){
                    lottie_data.url = sett[control_name+'_source_json']['url'];
                }else{
                    lottie_data.url = sett[control_name+'_lottie_animation_url'];
                }
                view.addRenderAttribute('panel-icon-'+ index, 'data-lottie-settings', JSON.stringify(lottie_data));
            }         
        }
        view.addRenderAttribute('panel-icon-'+ index, 'class', icon_class);
        if(sett[control_name+'_graphic_type'] == 'lottie' ){
            if(lottie_data.url != undefined){
                iconHtml = `<span ${view.getRenderAttributeString( 'panel-icon-'+ index )}></span>`;    
            }
        }else{
            if(sett[control_name+'_graphic_type'] === 'icon'){
                if(sett[control_name+'_graphic_icon']['value'] != ''){
                    var icon = elementor.helpers.renderIcon( view, sett[control_name+'_graphic_icon'], { 'aria-hidden': true }, 'i' , 'object' );
                    imageHtml = icon.value;
                    iconHtml = `<span ${ view.getRenderAttributeString( 'panel-icon-'+ index ) }>
                                ${imageHtml}
                                </span>`;
                }            
            }else{
                if(sett[control_name+'_graphic_image']['url'] != ''){
                    var image = {
                        id: sett[control_name+'_graphic_image']['id'],
                        url: sett[control_name+'_graphic_image']['url'],
                        size: sett[control_name+'_graphic_image_size'],
                        dimension: sett[control_name+'_graphic_image_custom_dimension'],
                        model: view.getEditModel()
                    };
                    var image_url = elementor.imagesManager.getImageUrl( image );
                    imageHtml = '<img src="' + image_url + '" />';
                    
                    iconHtml = `<span ${ view.getRenderAttributeString( 'panel-icon-'+ index ) }>
                                    ${imageHtml}
                                </span>`;
                }
            }
        }       
    }
    return iconHtml;
}

window.eae.validateHTMLTag = function( $tag, $collection = null, $fallback = null){
   if($collection == null){
        $collection = ['h1','h2','h3','h4','h5','h6','p','span','div'];
   }
   if($fallback == null){
    $fallback = 'h3';
   }    
   if($collection.includes($tag)){
        return $tag;
   }else{
        return $fallback;
   }
}