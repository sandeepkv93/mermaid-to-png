# Sample Markdown with Mermaid Diagrams

This is a test document with multiple Mermaid diagrams.

## Flowchart Example

Here's a simple flowchart:

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
```

## Sequence Diagram

And here's a sequence diagram:

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

## Regular Code Block

This should not be converted:

```javascript
console.log('Hello, World!');
```

## Class Diagram

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +void eat()
    }
    class Dog {
        +void bark()
    }
    Animal <|-- Dog
```

That's all for now!