/**
 * Flipscroll is a responsive table building class that includes a paging system.
 *
 *    Author: Jeff Walter
 *      Date: Jan. 26, 2012
 */ 

/**
 * Constructor
 * 
 * @param action   - url to get the table data from (json). 
 * @param page     - page number of the data to fetch. 
 * @param limit    - number of rows in each page.
 * @param template - optional, html table row template. 
 * @param data_key - optional, key in json where data is found. 
 */ 
function FlipScroll(flipscroll_container_selector, action, page, limit, template, data_key)
{
    this.flipscroll_container_selector = flipscroll_container_selector || '#flip-scroll';
    this.data_key = data_key || null;
    this.action = action;
    this.page = page || 1;
    this.default_page = this.page;
    this.limit = limit || 25;
    this.default_limit = this.limit;
    this.template = template;
    this.event_handlers = [];

    this.pager_length = 5;
    this.start = null;
    this.end = null;

    this.last_page = this.page;
    this.last_limit = this.limit;
}

/**
 * Sets the data source and paging options. 
 * 
 * @param action    - url to get the table data from (json). 
 * @param page      - page number of the data to fetch. 
 * @param limit     - number of rows in each page.
 */ 
FlipScroll.prototype.set_paging_options = function(action, page, limit)
{ 
    this.action = action;
    this.last_page = this.page;
    this.last_limit = this.limit;
    this.page = page || this.default_page;
    this.limit = limit || this.default_limit;
};

/**
 * Sets the row template to use during rendering
 *
 * You can either define a callback function that takes a row object, or define the html string to use as a row template.
 *
 * If you choose to pass an html string, this template should use {key} for the placeholder of the value to be replaced.
 * Given that your data looked like => { key: 'value' }, key would be replaced by value.
 * 
 * @param template  - template to use. 
 */ 
FlipScroll.prototype.set_row_template = function(template)
{
    this.row_template = template;
};

/**
 * Sets the row header template to use during rendering
 *
 * You can either define a callback function that takes a row header object, or define the html string to use as a row header template.
 *
 * If you choose to pass an html string, this template should use {key} for the placeholder of the value to be replaced.
 * Given that your data looked like => { key: 'value' }, key would be replaced by value.
 * 
 * @param template  - template to use. 
 */ 
FlipScroll.prototype.set_row_header_template = function(template)
{
    this.header_template = template;
};

/**
 * Sets the paging limit. Also resets the pager back to start. 
 *
 * @param limit     - number of rows in each page. 
 */ 
FlipScroll.prototype.set_limit = function(limit)
{
    this.page = 1;
    this.limit = limit;
};

/**
 * Sets the current page to fetch. 
 *
 * @param page      - page number of the data to fetch. 
 */
FlipScroll.prototype.set_current_page = function(page)
{
    this.page = page;
};

/**
 * Calculates and builds the html pager controls for the table. 
 *
 * @param paging    - object of the following format: (comes from .json urls). 
 *
 *      paging: {
 *          total_rows: 31,
 *          last_page: 2,
 *          current_page: 1,
 *          limit: 25
 *      }
 */
FlipScroll.prototype.build_pager = function(paging)
{
    var pages_remaining = paging.last_page - paging.current_page;
    var step = Math.floor(this.pager_length/2);
    this.start = 1;
    this.end = this.pager_length;

    // If we're at the first page.
    if( paging.current_page == this.start ) {

        if( pages_remaining >= this.pager_length ) {
            this.end = this.pager_length;
        }
        else if( pages_remaining ) {
            this.end = paging.current_page + pages_remaining;
        } 
        else {
            this.end = paging.current_page;
        }
    }
    // If we're at the last page.
    else if( pages_remaining == 0 ) {
        this.end = paging.last_page;
        this.start = this.end - (this.pager_length-1);
    }
    // If we're stuck in the middle.
    else {
        if( pages_remaining >= step ) {
            this.end = paging.current_page + step;
        }
        else {
            this.end = paging.last_page;
            step += pages_remaining;
        }
        if( paging.current_page <= step ) {
            this.start = 1;
            this.end = paging.current_page + this.start + step;
        }
        else {
            this.start = paging.current_page - step;
            if( this.start == 0 ) {
                this.start++;
                this.end++;
            }
        }
    }

    // We shouldn't need this, but just to be safe let's make sure we don't show an invalid index.
    if( this.start < 1 ) {
        this.start = 1;
    }
    if( this.end > paging.last_page ) {
        this.end = paging.last_page;
    }

    var showing_all = false;
    if( !this.limit || this.limit == paging.total_rows ) {
        showing_all = true;
        this.limit = this.default_limit;
    }

    // Build our pager.
    var active_css = 'active';
    var pager = '<div class="pagination"><ul>';

    if( !showing_all ) {
        active_css = ( showing_all || this.start == this.end ) ? 'active' : ''; 
        pager += '<li data-page="1" data-limit="'+paging.total_rows+'" class="all '+active_css+'"><a href="">All</a></li>';

        active_css = ( showing_all || paging.current_page == 1 ) ? 'active' : ''; 
        pager += '<li data-page="1" data-limit="'+this.limit+'" class="first '+active_css+'"><a href="">First</a></li>';

        active_css = ( !showing_all && paging.current_page > 1 ) ? '' : 'active'; 
        pager += '<li data-page="'+(paging.current_page-1)+'" data-limit="'+this.limit+'" class="prev '+active_css+'"><a href="">Prev</a></li>';
           
        for( var i=this.start; i <= this.end; i++ ) {
            active_css = ( !showing_all && i == paging.current_page ) ? 'active' : ''; 
            pager += '<li data-page="'+i+'" data-limit="'+this.limit+'" class="numeric '+active_css+'"><a href="">'+i+'</a></li>';
        }

        active_css = ( !showing_all && paging.current_page != paging.last_page ) ? '' : 'active'; 
        pager += '<li data-page="'+(paging.current_page+1)+'" data-limit="'+this.limit+'" class="next '+active_css+'"><a href="">Next</a></li>';
         
        active_css = ( showing_all || (paging.current_page == paging.last_page) ) ? 'active' : '';
        pager += '<li data-page="'+paging.last_page+'" data-limit="'+this.limit+'" class="last '+active_css+'"><a href="">Last</a></li>';
    }
    else {
        pager += '<li data-page="'+this.last_page+'" data-limit="'+this.last_limit+'" class="back"><a href="">Back</a></li>';
    }

    pager += '</ul>'+
             '</div>';

    return pager;
};

/**
 * Makes the ajax request to get the data and renders the table and paging controls.
 *
 */
FlipScroll.prototype.load = function()
{
    var self = this;

    $.ajax({
        url: 'https://'+location.hostname+self.action+'.json?page='+self.page+'&limit='+self.limit,
        dataType: 'json',
        accepts: 'json',
        type: 'GET',
        timeout: 60000,
        error: function(xhr, ajaxOptions, throwError) {
            //TODO: Figure out what to do in case we fail to load data.
            $('#dialog').html('<p>' + $.parseJSON(xhr.responseText).errors.join('<br/>') + '</p>');
            $('#dialog').dialog('open');
        },
        success: function(data, textStatus, jqXHR) {
           
            // Build the pager. 
            var html = self.build_pager(data.paging);

            // Build the table.
            html += '<table class="table-bordered table-striped table-condensed cf">';
            html += '<thead class="cf">';
            html += '<tr>';

            // Build table header.

            // If we got a row header template callback use it. 
            if( self.header_template && (self.header_template instanceof Function) ) {
                html += self.header_template(data.metadata);
            }
            // Else if we got a row template callback use it. 
            else if( self.header_template ) {
                var current_header_template = self.header_template;
                Object.keys(data.metadata).forEach(function(column) {
                    var regex = new RegExp('{'+column+'}' ,'g');
                    current_header_template = current_header_template.replace(regex, data.metadata[column]);
                });
                html += current_header_template;
            } 
            // Otherwise, default to plain'ole table rows.
            else {
                html += '<tr>';
                Object.keys(data.metadata).forEach(function(key) {
                    html += '<th>'+data.metadata[key]+'</th>';
                });
                html += '</tr>';
            }

            html += '</thead>';
            html += '<tbody>';

            // Get the row data so we can build our table body.
            var rows = {};
            if( self.data_key ) {
                rows = data[self.data_key];
            }
            // Determine which collection holds our data.
            else {
                Object.keys(data).forEach(function(key) {
                    if( $.inArray(key, ['paging', 'metadata']) === -1 ) {
                        rows = data[key];
                        self.data_key = key;
                    }
                });
            }

            var i = 0;
            // Loop through the rows and build the table body.
            $(rows).each(function() {
                var row = this;

                // If we got a row template callback use it. 
                if( self.row_template && (self.row_template instanceof Function) ) {
                    html += self.row_template(row, i); 
                }
                // else if we got a row template callback use it. 
                else if( self.row_template ) {
                    var current_row_template = self.row_template;
                    var regex = null;
                    Object.keys(row).forEach(function(column) {
                        regex = new RegExp('{'+column+'}' ,'g');
                        current_row_template = current_row_template.replace(regex, row[column]);
                    });
                    html += current_row_template;
                }
                // Otherwise, default to plain'ole table rows.
                else {
                    html += '<tr>';
                    Object.keys(row).forEach(function(column) {
                        html += '<td>'+row[column]+'</td>';
                    });
                    html += '</tr>';
                }
                i++;
            });
            html += '</tbody>';
            html += '</table>';

            // Update the table container.
            $(self.flipscroll_container_selector).html(html);
        }
    });
};

FlipScroll.prototype.push_eventhandler = function(hander)
{
    this.event_handlers.push(hander);
}

/**
 * Binds the jQuery click event handler to the paging controls that it needs to.
 */
FlipScroll.prototype.bind = function()
{
    var self = this;

    // Make sure our inactive elements don't submit when clicked.
    $(this.flipscroll_container_selector).on('click', '.pagination li.active', function(event) { return false; });
    
    // Make sure our active elements submit when clicked.
    $(this.flipscroll_container_selector).on('click', '.pagination li:not(.active)', function(event) {
        var link = $(event.target).parent();
        self.set_paging_options( window.location.pathname, link.data('page'), link.data('limit') ); 
        self.load(); 
        return false;
    });

    if( this.event_handlers.length ) {
        for( var i=0, len=this.event_handlers.length; i < len; i++ ) {
            if( this.event_handlers[i] instanceof Function ) {
                this.event_handlers[i]();
            }
            else {
                throw 'Event-handlers MUST be functions.'; 
            }
        }
    }
};
