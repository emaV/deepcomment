// $Id$

/**
 * @file
 * Javascript for managing jQuery dialogs for viewing and writing comments
 *
 */

var DeepComment = {

  /**
   * Array of open dialogs
   */
  commentViewDialogs : [],

  /**
   * An offset used to keep new dialogs distinguishable when opened
   */
  offset: 0,

  /**
   * The editor that DeepComment detects
   */

  editor: '',

  /**
   * Array of the editors javascript objects to check for
   */

  wysiwygs: ['tinyMCE'],

  /**
   * Opens a dialog for commenting on a paragraph
   * @param {Object} event
   */
  openCommentDialog: function(event) {

    $('.ui-dialog-title').removeClass('deepcomment-active');
    $('.deepcomment-para').removeClass('deepcomment-active');

    if($(event.target).hasClass('deepcomment-view-dialog-comment')) {
      var paraId = $(event.target).data('paraId');
    } else if($(event.target).hasClass('deepcomment-para-comment')) {
      var paraId = event.target.parentNode.parentNode.id;
    }

    var commentDialog = $('#deepcomment-comment-form-dialog').dialog(DeepComment.commentSettings);
    commentDialog.dialog('moveToTop');
    $('.ui-dialog-title', commentDialog.parent()).addClass('deepcomment-active');
    $('#' + paraId).addClass('deepcomment-active');

    commentDialog.empty();
    commentDialog.data('paraId', paraId);
    commentDialog.dialog('option', 'title', "Comment on " + DeepComment.getParaSnippet(paraId));
    commentDialog.dialog('option', 'width', '550');
    commentDialog.dialog('open');

    DeepComment.appendCommentFormClone(paraId, commentDialog);
  },

  // Making the wysiwyg editors work properly with jQuery requires some shenanigans.
  // appendCommentFormClone, commentFormUninit, and commmentFormInit aim to
  // handle that on an editor-by-editor basis.

  /**
   * Uninitialize the editors if needed before the jQuery starts working
   * @param string editorElId the id of the editor element to uninitialize
   */

  commentFormUninit: function(editorElId) {
    switch(DeepComment.editor) {
      case 'tinyMCE':
        tinyMCE.execCommand('mceRemoveControl', false, 'edit-comment');
        tinyMCE.execCommand('mceRemoveControl', false,  editorElId);
      break;
    }
  },

  /**
   * Reinitialize the editors after the jQuery has placed the elements in dialogs
   * @param string editorElId
   */

  commentFormInit: function(editorElId) {
    switch(DeepComment.editor) {
      case 'tinyMCE':
        tinyMCE.execCommand('mceAddControl', false, 'edit-comment');
        tinyMCE.execCommand('mceAddControl', false,  editorElId);

      break;
    }
  },
  /**
   * Append a comment for to a dialoge, after doing work to make the process safe with editors
   * @param string paraId id of the para being commented on
   * @param {Object} d the jQuery dialog to append the comment form to
   */
  appendCommentFormClone: function(paraId, d) {
    if(d.attr('id') == 'deepcomment-comment-form-dialog' ) {
      var mceId = 'edit-' + paraId + '-cForm';
    } else {
      var mceId = 'edit-' + paraId;
    }
    DeepComment.commentFormUninit(mceId);

    var commentFormClone = $('#deepcomment-comment-form').clone();
    commentFormClone.append($('#edit-deepcomment-para-id').clone());
    $('#edit-deepcomment-para-id', commentFormClone).val(paraId);
    $('textarea', commentFormClone).attr('id', mceId);

    d.append(commentFormClone);
    $('textarea', commentFormClone).addClass('wtf');
    DeepComment.commentFormInit(mceId);

  },

  /**
   * Opens a dialog for viewing all the comments on a paragraph
   * @param {Object} event
   */
  openViewDialog: function(event) {


    if( $(event.target).hasClass('deepcomment-comment-open-on-para')) {
      var id = $(event.target).parent().attr('id');
      var paraId = id.replace('deepcomment-on-para-', '');
      var targetP = event.target;
      var pos = [targetP.offsetLeft + targetP.clientWidth / 3 + 150 + DeepComment.commentViewDialogs.length * 30, targetP.clientTop - 30];
    } else if( $(event.target).hasClass('deepcomment-para-view')) {
      var targetP = event.target.parentNode.parentNode;
      var pos = [targetP.offsetLeft + targetP.clientWidth / 3 + 150 + DeepComment.commentViewDialogs.length * 30, targetP.offsetTop - 30];
      var paraId = targetP.id;
    }


    var d = DeepComment.getCommentViewDialog(paraId);
    d.empty();

    var snippet = DeepComment.getParaSnippet(paraId);

    var comments = $(DeepComment.gatherCommentsForPara(paraId));

    comments.each(function(index, el) {
      var elClone = $(el).clone();
      var indentCount = 0
      while($(el).parent().hasClass('indented')) {
        indentCount++;
        el = $(el).parent();
      }
      var indent = 20 * indentCount + 'px';
      $(elClone).css({marginLeft: indent}) ;
      d.append(elClone);
    });

    d.dialog('option', 'title', 'Comments on ' + snippet);
    d.dialog('option', 'position', pos);
    d.dialog('open');
    if(DeepComment.commentsInPopup) {
      DeepComment.appendCommentFormClone(paraId, d);
    } else {
      d.append(DeepComment.getViewDialogCommentLink(paraId));
    }

  },

  /**
   * Gathers the comments that apply to a paragraph
   * @param string paraId
   * @return array Array of comment nodes
   */
  gatherCommentsForPara: function(paraId) {
    var returnArray = new Array();

    var comments = $('.comment').each(function(index, el) {
      var orSpans = $('#deepcomment-on-para-' + paraId, el);

      if(orSpans.length != 0) {
        returnArray[returnArray.length] = el;
      }
    });
    $.unique(returnArray);
    return returnArray;
  },


  getViewDialogCommentLink: function(paraId) {
    var link = document.createElement('p');
    $(link).text('Add Comment');
    $(link).data('paraId', paraId);
    $(link).addClass('deepcomment-view-dialog-comment');
    $(link).click(DeepComment.openCommentDialog);
    return link;
  },

  /**
   * Return the dialog to view comments on a paragraph, or create one if needed
   * @param string paraId
   * @return jQuery dialog
   */
  getCommentViewDialog: function(paraId) {


    $('.ui-dialog-title').removeClass('deepcomment-active');
    for(var i = 0; i<DeepComment.commentViewDialogs.length; i++) {
      if(DeepComment.commentViewDialogs[i].data('paraId') == paraId) {
        $('.ui-dialog-title', DeepComment.commentViewDialogs[i].parent()).addClass('deepcomment-active');
        DeepComment.commentViewDialogs[i].dialog('moveToTop');
        var paraPos = $('#' + paraId).offset();
        DeepComment.commentViewDialogs[i].dialog('option', 'position', [paraPos.left + 200 + DeepComment.getOffset(), 'top' + 2]);
        return DeepComment.commentViewDialogs[i];
      }
    }

    var d = $('#deepcomment-comments-dialog').dialog(DeepComment.commentViewSettings).clone();

    d.dialog(DeepComment.commentViewSettings);
    d.data('paraId', paraId);
    DeepComment.commentViewDialogs.push(d);


    return d;
  },

  /**
   * Return a snippet from the paragraph
   * @param string paraId
   * @return string The first few characters of the paragraph
   */
  getParaSnippet: function(paraId) {
    var text = $('#' + paraId).text();
    var textArray = text.substr(1).split(' ');
    textArray = textArray.slice(0, 4);
    return '"' + textArray.join(' ') + '. . ."';
  },

  /**
   * Callback for when a dialog receives focus
   * @param {Object} event
   * @param {Object} ui
   */
  commentViewDialogFocus: function(event, ui) {

    $('.ui-dialog-title').removeClass('deepcomment-active');
    $('.ui-dialog-title', event.target.parentNode).addClass('deepcomment-active');
    var paraId = $(event.target).data('paraId');
    $('.deepcomment-para').removeClass('deepcomment-active');
    $('#' + paraId).addClass('deepcomment-active');

  },

  /**
   * Callback for when a dialog closes
   * @param {Object} event
   * @param {Object} ui
   */
  commentViewDialogClose: function(event, ui) {
    var paraId = $(event.target).data('paraId');
    var mceId = 'edit-' + paraId;
    DeepComment.commentFormUninit(mceId);
      $('#' + paraId).removeClass('deepcomment-active');
      for(var i = 0; i<DeepComment.commentViewDialogs.length; i++) {
        if($(DeepComment.commentViewDialogs[i]).data('paraId') == paraId) {
           DeepComment.commentViewDialogs[i].empty();
           DeepComment.commentViewDialogs.splice(i, 1);
        }
      }
    DeepComment.commentFormInit(mceId);
  },

  commentDialogClose: function(event, ui) {
    var paraId = $(event.target).data('paraId');
    var mceId = 'edit-' + paraId;
    DeepComment.commentFormUninit(mceId);
    $('#deepcomment-comment-form-dialog').empty();
    $('.deepcomment-active').removeClass('deepcomment-active');
    DeepComment.commentFormInit(mceId);
  },

  getOffset: function() {
    DeepComment.offset = DeepComment.offset + 15;
    if (DeepComment.offset > 180) {
      DeepComment.offset = 0;
    }
    return DeepComment.offset;
  }
}

DeepComment.commentViewSettings =
    {
      autoOpen: false,
      draggable: true,
      resizable: true,
      width: '550',
      focus: DeepComment.commentViewDialogFocus,
      close: DeepComment.commentViewDialogClose
    };

DeepComment.commentSettings =
    {
      autoOpen: false,
      draggable: true,
      resizable: true,
      width: '550',
      focus: DeepComment.commentViewDialogFocus,
      close: DeepComment.commentDialogClose
    };


 $(document).ready(function(){
    $('.deepcomment-para-comment').click(DeepComment.openCommentDialog);
    $('.deepcomment-para-view').click(DeepComment.openViewDialog);
    $('.deepcomment-comment-open-on-para').click(DeepComment.openViewDialog);
    DeepComment.commentFormHTML = $('#deepcomment-comment-form').html();
    DeepComment.commentDialog = $('#deepcomment-comment-form-dialog').dialog(DeepComment.commentSettings);
    for each (var editor in DeepComment.wysiwygs) {
      try {
        eval(editor);
        DeepComment.editor = editor;
      } catch (e) {

      }
    }
 });
