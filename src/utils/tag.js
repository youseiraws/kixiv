export const tag_types = [
  {
    name: 'any',
    value: '',
    color: '#000000',
  },
  {
    name: 'general',
    value: 0,
    color: '#ffaaae',
  },
  {
    name: 'artist',
    value: 1,
    color: '#cccc00',
  },
  {
    name: 'copyright',
    value: 3,
    color: '#dd00dd',
  },
  {
    name: 'character',
    value: 4,
    color: '#00aa00',
  },
  {
    name: 'style',
    value: 5,
    color: '#ff2020',
  },
  {
    name: 'circle',
    value: 6,
    color: '#00bbbb',
  },
]

let tag_data = ''

function regex_escape(str) {
  return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1')
}

function create_tag_search_regex(tag, options) {
  /* Split the tag by character. */
  var letters = tag.split('')

  /*
   * We can do a few search methods:
   *
   * 1: Ordinary prefix search.
   * 2: Name search. "aaa_bbb" -> "aaa*_bbb*|bbb*_aaa*".
   * 3: Contents search; "tgm" -> "t*g*m*" -> "tagme".  The first character is still always
   * matched exactly.
   *
   * Avoid running multiple expressions.  Instead, combine these into a single one, then run
   * each part on the results to determine which type of result it is.  Always show prefix and
   * name results before contents results.
   */
  var regex_parts = []

  /* Allow basic word prefix matches.  "tag" matches at the beginning of any word
   * in a tag, eg. both "tagme" and "dont_tagme". */
  /* Add the regex for ordinary prefix matches. */
  var s = '(([^`]*_)?'

  letters.forEach(function(letter) {
    var escaped_letter = regex_escape(letter)
    s += escaped_letter
  })
  s += ')'
  regex_parts.push(s)

  /* Allow "fir_las" to match both "first_last" and "last_first". */
  if (tag.indexOf('_') != -1) {
    var first = tag.split('_', 1)[0]
    var last = tag.slice(first.length + 1)

    first = regex_escape(first)
    last = regex_escape(last)

    var s = '('
    s += '(' + first + '[^`]*_' + last + ')'
    s += '|'
    s += '(' + last + '[^`]*_' + first + ')'
    s += ')'
    regex_parts.push(s)
  }

  /* Allow "tgm" to match "tagme".  If top_results_only is set, we only want primary results,
   * so omit this match. */
  if (!options.top_results_only) {
    var s = '('
    letters.forEach(function(letter) {
      var escaped_letter = regex_escape(letter)
      s += escaped_letter
      s += '[^`]*'
    })
    s += ')'
    regex_parts.push(s)
  }

  /* The space is included in the result, so the result tags can be matched with the
   * same regexes, for in reorder_search_results.
   *
   * (\d)+  match the alias ID                      1`
   * [^ ]*: start at the beginning of any alias     1`foo`bar`
   * ... match ...
   * [^`]*` all matches are prefix matches          1`foo`bar`tagme`
   * [^ ]*  match any remaining aliases             1`foo`bar`tagme`tag_me`
   */
  var regex_string = regex_parts.join('|')
  regex_string = '(\\d+)[^ ]*`(' + regex_string + ')[^`]*`[^ ]* '

  return new RegExp(regex_string, options.global ? 'g' : '')
}

function retrieve_tag_search(
  re,
  source,
  max_results = Number.POSITIVE_INFINITY
) {
  var results = []

  while (results.length < max_results) {
    var m = re.exec(source)
    if (!m) break

    var tag = m[0]
    /* Ignore this tag.  We need a better way to blackhole tags. */
    if (tag.indexOf(':deletethistag:') != -1) continue
    if (results.indexOf(tag) == -1) results.push(tag)
  }
  return results
}
/*
 * Contents matches (t*g*m -> tagme) are lower priority than other results.  Within
 * each search type (recent and main), sort them to the bottom.
 */
function reorder_search_results(tag, results) {
  var re = create_tag_search_regex(tag, {
    top_results_only: true,
    global: false,
  })
  var top_results = []
  var bottom_results = []

  results.forEach(function(tag) {
    if (re.test(tag)) top_results.push(tag)
    else bottom_results.push(tag)
  })
  return top_results.concat(bottom_results)
}

/*
 * Return an array of completions for a tag.  Tag types of returned tags will be
 * registered in Post.tag_types, if necessary.
 *
 * options = {
 *   max_results: 10
 * }
 *
 * [["tag1", "tag2", "tag3"], 1]
 *
 * The value 1 is the number of results from the beginning which come from recent_tags,
 * rather than tag_data.
 */
export function complete_tag(tag, max_results) {
  if (tag == '') return [[], 0]

  /* Make a list of all results; this will be ordered recent tags first, other tags
   * sorted by tag count.  Request more results than we need, since we'll reorder
   * them below before cutting it off. */
  var re = create_tag_search_regex(tag, { global: true })
  var main_results = retrieve_tag_search(re, tag_data, max_results)

  var results = reorder_search_results(tag, main_results)

  /* Hack: if the search is one of the ratings shortcuts, put that at the top, even though
   * it's not a real tag. */
  if ('sqe'.indexOf(tag) != -1) results.unshift('0`' + tag + '` ')

  /* Strip the "1`" tag type prefix off of each result. */
  var final_results = []
  results.forEach(function(tag) {
    var m = tag.match(/(\d+)`([^`]*)`(([^ ]*)`)? /)
    if (!m) {
      ReportError(
        "Unparsable cached tag: '" + tag + "'",
        null,
        null,
        null,
        null
      )
      throw "Unparsable cached tag: '" + tag + "'"
    }

    var tag = {
      name: m[2],
      type: parseInt(m[1]),
    }

    if (final_results.indexOf(tag) == -1) {
      final_results.push(tag)
    }
  })

  return final_results
}

export function set_tag_data(summary) {
  tag_data = summary
}

export function get_tag_color(value) {
  return tag_types.find(tag_type => tag_type.value === value).color
}

export function get_tag_value(name) {
  return tag_types.find(tag_type => tag_type.name === name).value
}
