var sb = require("../sideburns"),
    fs = require("fs"),
    assert = require("assert"),
    template,
    data = {
        link: "<a href='http://example.com'>text with html</a>",
        users: [
            "Joe",
            "Pete",
            "<script>alert('injection!');</script>"
        ]
    },
    options = {escape: 'xml'},
    output;

template = fs.readFileSync(__dirname + "/files/escapedata.sb").toString();
output = sb(template, data, options);
assert.strictEqual(output, "This is some &lt;a href=&#39;http://example.com&#39;&gt;text with html&lt;/a&gt; inside it.");
